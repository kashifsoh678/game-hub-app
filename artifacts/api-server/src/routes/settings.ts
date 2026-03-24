import { Router } from "express";
import { randomUUID } from "crypto";
import { db, settingsTable, eq } from "@workspace/db";
import { authMiddleware, adminMiddleware } from "../middlewares/auth.js";

const router = Router();

async function getOrCreateSettings() {
  const all = await db.select().from(settingsTable).limit(1);
  if (all.length > 0) return all[0];

  const [created] = await db
    .insert(settingsTable)
    .values({
      id: randomUUID(),
      defaultHourlyRate: "350",
      currency: "PKR",
      businessName: "Gaming Zone",
      timezone: "Asia/Karachi",
    })
    .returning();
  return created;
}

router.get("/", authMiddleware, async (req: any, res: any) => {
  try {
    const settings = await getOrCreateSettings();
    res.json({
      id: settings.id,
      defaultHourlyRate: parseFloat(settings.defaultHourlyRate),
      currency: settings.currency,
      businessName: settings.businessName,
      timezone: settings.timezone,
    });
  } catch (err) {
    req.log.error({ err }, "Get settings error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/", authMiddleware, adminMiddleware, async (req: any, res: any) => {
  const { defaultHourlyRate, currency, businessName, timezone } = req.body;

  try {
    const current = await getOrCreateSettings();
    const updates: Record<string, unknown> = {};
    if (defaultHourlyRate !== undefined) updates.defaultHourlyRate = String(defaultHourlyRate);
    if (currency !== undefined) updates.currency = currency;
    if (businessName !== undefined) updates.businessName = businessName;
    if (timezone !== undefined) updates.timezone = timezone;

    const [updated] = await db
      .update(settingsTable)
      .set(updates)
      .where(eq(settingsTable.id, current.id))
      .returning();

    res.json({
      id: updated.id,
      defaultHourlyRate: parseFloat(updated.defaultHourlyRate),
      currency: updated.currency,
      businessName: updated.businessName,
      timezone: updated.timezone,
    });
  } catch (err) {
    req.log.error({ err }, "Update settings error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
