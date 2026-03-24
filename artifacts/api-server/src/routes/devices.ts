import { Router } from "express";
import { randomUUID } from "crypto";
import { db, devicesTable, sessionsTable, eq, isNull } from "@workspace/db";
import { authMiddleware, adminMiddleware } from "../middlewares/auth.js";

const router = Router();

router.get("/", authMiddleware, async (req, res) => {
  try {
    const devices = await db.select().from(devicesTable).orderBy(devicesTable.name);

    const activeSessions = await db
      .select()
      .from(sessionsTable)
      .where(isNull(sessionsTable.endTime));

    const sessionMap = new Map(
      activeSessions.map((s) => [s.deviceId, s])
    );

    const result = devices.map((d) => {
      const session = sessionMap.get(d.id);
      return {
        id: d.id,
        name: d.name,
        type: d.type,
        hourlyRate: parseFloat(d.hourlyRate),
        status: d.status,
        createdAt: d.createdAt.toISOString(),
        activeSession: session
          ? {
              sessionId: session.id,
              startTime: session.startTime.toISOString(),
            }
          : undefined,
      };
    });

    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Get devices error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", authMiddleware, adminMiddleware, async (req, res) => {
  const { name, type, hourlyRate } = req.body;
  if (!name || !type || hourlyRate === undefined) {
    res.status(400).json({ error: "name, type, and hourlyRate required" });
    return;
  }

  try {
    const id = randomUUID();
    const [device] = await db
      .insert(devicesTable)
      .values({ id, name, type, hourlyRate: String(hourlyRate), status: "available" })
      .returning();

    res.status(201).json({
      id: device.id,
      name: device.name,
      type: device.type,
      hourlyRate: parseFloat(device.hourlyRate),
      status: device.status,
      createdAt: device.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Create device error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  const { id } = req.params;
  const { name, type, hourlyRate } = req.body;

  try {
    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (type !== undefined) updates.type = type;
    if (hourlyRate !== undefined) updates.hourlyRate = String(hourlyRate);

    const [device] = await db
      .update(devicesTable)
      .set(updates)
      .where(eq(devicesTable.id, id as string))
      .returning();

    if (!device) {
      res.status(404).json({ error: "Device not found" });
      return;
    }

    res.json({
      id: device.id,
      name: device.name,
      type: device.type,
      hourlyRate: parseFloat(device.hourlyRate),
      status: device.status,
      createdAt: device.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Update device error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    const device = await db.select().from(devicesTable).where(eq(devicesTable.id, id as string)).limit(1);
    if (!device[0]) {
      res.status(404).json({ error: "Device not found" });
      return;
    }

    if (device[0].status === "in_use") {
      res.status(400).json({ error: "Cannot delete a device that is currently in use" });
      return;
    }

    await db.delete(devicesTable).where(eq(devicesTable.id, id as string));
    res.json({ success: true, message: "Device deleted" });
  } catch (err) {
    req.log.error({ err }, "Delete device error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
