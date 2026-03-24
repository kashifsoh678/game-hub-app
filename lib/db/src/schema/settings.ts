import { pgTable, text, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const settingsTable = pgTable("settings", {
  id: text("id").primaryKey(),
  defaultHourlyRate: numeric("default_hourly_rate", { precision: 10, scale: 2 }).notNull().default("350"),
  currency: text("currency").notNull().default("PKR"),
  businessName: text("business_name").notNull().default("Gaming Zone"),
  timezone: text("timezone").notNull().default("Asia/Karachi"),
});

export const insertSettingsSchema = createInsertSchema(settingsTable);
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settingsTable.$inferSelect;
