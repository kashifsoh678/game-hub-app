import { Router } from "express";
import { randomUUID } from "crypto";
import { db, devicesTable, sessionsTable, usersTable } from "@workspace/db";
import { eq, isNull, isNotNull, and, gte, lte, like, sql } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth.js";

const router = Router();

router.post("/start", authMiddleware, async (req, res) => {
  const { deviceId } = req.body;
  if (!deviceId) {
    res.status(400).json({ error: "deviceId required" });
    return;
  }

  try {
    const devices = await db.select().from(devicesTable).where(eq(devicesTable.id, deviceId)).limit(1);
    const device = devices[0];
    if (!device) {
      res.status(404).json({ error: "Device not found" });
      return;
    }

    if (device.status === "in_use") {
      res.status(400).json({ error: "Device is already in use" });
      return;
    }

    const existingSession = await db
      .select()
      .from(sessionsTable)
      .where(and(eq(sessionsTable.deviceId, deviceId), isNull(sessionsTable.endTime)))
      .limit(1);

    if (existingSession.length > 0) {
      res.status(400).json({ error: "Device already has an active session" });
      return;
    }

    const sessionId = randomUUID();
    const now = new Date();

    const [session] = await db
      .insert(sessionsTable)
      .values({
        id: sessionId,
        deviceId,
        startTime: now,
        hourlyRate: device.hourlyRate,
        createdBy: req.user!.id,
      })
      .returning();

    await db.update(devicesTable).set({ status: "in_use" }).where(eq(devicesTable.id, deviceId));

    res.status(201).json({
      id: session.id,
      deviceId: session.deviceId,
      deviceName: device.name,
      startTime: session.startTime.toISOString(),
      endTime: null,
      durationMinutes: null,
      hourlyRate: parseFloat(session.hourlyRate),
      totalAmount: null,
      createdBy: session.createdBy,
      operatorName: req.user!.name,
      createdAt: session.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Start session error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/stop", authMiddleware, async (req, res) => {
  const { deviceId } = req.body;
  if (!deviceId) {
    res.status(400).json({ error: "deviceId required" });
    return;
  }

  try {
    const activeSessions = await db
      .select()
      .from(sessionsTable)
      .where(and(eq(sessionsTable.deviceId, deviceId), isNull(sessionsTable.endTime)))
      .limit(1);

    const session = activeSessions[0];
    if (!session) {
      res.status(404).json({ error: "No active session found for this device" });
      return;
    }

    const devices = await db.select().from(devicesTable).where(eq(devicesTable.id, deviceId)).limit(1);
    const device = devices[0];
    const users = await db.select().from(usersTable).where(eq(usersTable.id, session.createdBy)).limit(1);
    const operator = users[0];

    const endTime = new Date();
    const durationMs = endTime.getTime() - session.startTime.getTime();
    const durationMinutes = Math.ceil(durationMs / (1000 * 60));
    const durationHours = durationMinutes / 60;
    const totalAmount = parseFloat((durationHours * parseFloat(session.hourlyRate)).toFixed(2));

    const [updated] = await db
      .update(sessionsTable)
      .set({ endTime, durationMinutes, totalAmount: String(totalAmount) })
      .where(eq(sessionsTable.id, session.id))
      .returning();

    await db.update(devicesTable).set({ status: "available" }).where(eq(devicesTable.id, deviceId));

    res.json({
      id: updated.id,
      deviceId: updated.deviceId,
      deviceName: device?.name ?? "",
      startTime: updated.startTime.toISOString(),
      endTime: updated.endTime!.toISOString(),
      durationMinutes: updated.durationMinutes,
      hourlyRate: parseFloat(updated.hourlyRate),
      totalAmount: parseFloat(updated.totalAmount!),
      createdBy: updated.createdBy,
      operatorName: operator?.name ?? "",
      createdAt: updated.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Stop session error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/today", authMiddleware, async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const sessions = await db
      .select({
        session: sessionsTable,
        deviceName: devicesTable.name,
        operatorName: usersTable.name,
      })
      .from(sessionsTable)
      .leftJoin(devicesTable, eq(sessionsTable.deviceId, devicesTable.id))
      .leftJoin(usersTable, eq(sessionsTable.createdBy, usersTable.id))
      .where(gte(sessionsTable.startTime, startOfDay))
      .orderBy(sql`${sessionsTable.startTime} DESC`);

    res.json(
      sessions.map(({ session, deviceName, operatorName }) => ({
        id: session.id,
        deviceId: session.deviceId,
        deviceName: deviceName ?? "",
        startTime: session.startTime.toISOString(),
        endTime: session.endTime?.toISOString() ?? null,
        durationMinutes: session.durationMinutes,
        hourlyRate: parseFloat(session.hourlyRate),
        totalAmount: session.totalAmount ? parseFloat(session.totalAmount) : null,
        createdBy: session.createdBy,
        operatorName: operatorName ?? "",
        createdAt: session.createdAt.toISOString(),
      }))
    );
  } catch (err) {
    req.log.error({ err }, "Get today sessions error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/", authMiddleware, async (req, res) => {
  const page = parseInt(String(req.query.page ?? "1"));
  const limit = parseInt(String(req.query.limit ?? "20"));
  const deviceNameFilter = req.query.deviceName as string | undefined;
  const startDate = req.query.startDate as string | undefined;
  const endDate = req.query.endDate as string | undefined;
  const filter = req.query.filter as string | undefined;

  const offset = (page - 1) * limit;

  try {
    const conditions = [];

    if (filter === "today") {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      conditions.push(gte(sessionsTable.startTime, startOfDay));
    } else if (filter === "week") {
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - 7);
      startOfWeek.setHours(0, 0, 0, 0);
      conditions.push(gte(sessionsTable.startTime, startOfWeek));
    }

    if (startDate) {
      conditions.push(gte(sessionsTable.startTime, new Date(startDate)));
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      conditions.push(lte(sessionsTable.startTime, end));
    }

    const query = db
      .select({
        session: sessionsTable,
        deviceName: devicesTable.name,
        operatorName: usersTable.name,
      })
      .from(sessionsTable)
      .leftJoin(devicesTable, eq(sessionsTable.deviceId, devicesTable.id))
      .leftJoin(usersTable, eq(sessionsTable.createdBy, usersTable.id));

    const baseWhere = conditions.length > 0 ? and(...conditions) : undefined;

    const allRows = await (baseWhere ? query.where(baseWhere) : query);

    const filtered = deviceNameFilter
      ? allRows.filter((r) =>
          r.deviceName?.toLowerCase().includes(deviceNameFilter.toLowerCase())
        )
      : allRows;

    filtered.sort((a, b) => b.session.startTime.getTime() - a.session.startTime.getTime());

    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);
    const paginated = filtered.slice(offset, offset + limit);

    res.json({
      sessions: paginated.map(({ session, deviceName, operatorName }) => ({
        id: session.id,
        deviceId: session.deviceId,
        deviceName: deviceName ?? "",
        startTime: session.startTime.toISOString(),
        endTime: session.endTime?.toISOString() ?? null,
        durationMinutes: session.durationMinutes,
        hourlyRate: parseFloat(session.hourlyRate),
        totalAmount: session.totalAmount ? parseFloat(session.totalAmount) : null,
        createdBy: session.createdBy,
        operatorName: operatorName ?? "",
        createdAt: session.createdAt.toISOString(),
      })),
      total,
      page,
      totalPages,
    });
  } catch (err) {
    req.log.error({ err }, "Get sessions error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
