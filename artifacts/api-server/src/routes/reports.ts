import { Router } from "express";
import { db, sessionsTable, devicesTable, eq, gte, isNotNull, sql } from "@workspace/db";
import { authMiddleware, adminMiddleware } from "../middlewares/auth.js";

const router = Router();

router.get("/daily", authMiddleware, adminMiddleware, async (req: any, res: any) => {
  const days = parseInt(String(req.query.days ?? "7"));

  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const sessions = await db
      .select({
        session: sessionsTable,
        deviceName: devicesTable.name,
      })
      .from(sessionsTable)
      .leftJoin(devicesTable, eq(sessionsTable.deviceId, devicesTable.id))
      .where(gte(sessionsTable.startTime, startDate));

    const completedSessions = sessions.filter((s) => s.session.endTime !== null);

    const dailyMap = new Map<string, { revenue: number; sessions: number }>();
    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (days - 1 - i));
      const key = d.toISOString().split("T")[0];
      dailyMap.set(key, { revenue: 0, sessions: 0 });
    }

    for (const { session } of completedSessions) {
      const key = session.startTime.toISOString().split("T")[0];
      if (dailyMap.has(key)) {
        const entry = dailyMap.get(key)!;
        entry.revenue += parseFloat(session.totalAmount ?? "0");
        entry.sessions += 1;
      }
    }

    const dailyRevenue = Array.from(dailyMap.entries()).map(([date, data]) => ({
      date,
      revenue: parseFloat(data.revenue.toFixed(2)),
      sessions: data.sessions,
    }));

    const deviceMap = new Map<string, { sessions: number; revenue: number }>();
    for (const { session, deviceName } of completedSessions) {
      const name = deviceName ?? "Unknown";
      const entry = deviceMap.get(name) ?? { sessions: 0, revenue: 0 };
      entry.sessions += 1;
      entry.revenue += parseFloat(session.totalAmount ?? "0");
      deviceMap.set(name, entry);
    }

    const deviceUsage = Array.from(deviceMap.entries())
      .map(([deviceName, data]) => ({
        deviceName,
        sessions: data.sessions,
        revenue: parseFloat(data.revenue.toFixed(2)),
      }))
      .sort((a, b) => b.sessions - a.sessions);

    const todaySessions = sessions.filter((s) => {
      const d = s.session.startTime;
      return d >= startOfToday;
    });

    const todayEarnings = todaySessions
      .filter((s) => s.session.endTime !== null)
      .reduce((sum, s) => sum + parseFloat(s.session.totalAmount ?? "0"), 0);

    const mostUsedEntry = deviceUsage[0];
    const mostUsedDevice = mostUsedEntry?.deviceName ?? null;

    res.json({
      dailyRevenue,
      deviceUsage,
      todayEarnings: parseFloat(todayEarnings.toFixed(2)),
      todaySessions: todaySessions.length,
      mostUsedDevice,
    });
  } catch (err) {
    req.log.error({ err }, "Daily report error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/monthly", authMiddleware, adminMiddleware, async (req: any, res: any) => {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const sessions = await db
      .select()
      .from(sessionsTable)
      .where(gte(sessionsTable.startTime, startOfMonth));

    const completed = sessions.filter((s) => s.endTime !== null);
    const monthlyEarnings = completed.reduce(
      (sum, s) => sum + parseFloat(s.totalAmount ?? "0"),
      0
    );

    const daysInMonth = new Date().getDate();
    const avgDailyRevenue = monthlyEarnings / daysInMonth;

    res.json({
      monthlyEarnings: parseFloat(monthlyEarnings.toFixed(2)),
      monthlySessions: sessions.length,
      avgDailyRevenue: parseFloat(avgDailyRevenue.toFixed(2)),
    });
  } catch (err) {
    req.log.error({ err }, "Monthly report error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
