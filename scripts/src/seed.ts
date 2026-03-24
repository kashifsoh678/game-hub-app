import { db, usersTable, devicesTable, settingsTable } from "@workspace/db";
import { randomUUID } from "crypto";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";

async function seed() {
  console.log("Seeding database...");

  const existingAdmin = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, "admin@gamingzone.com"))
    .limit(1);

  if (existingAdmin.length === 0) {
    const passwordHash = await bcrypt.hash("admin123", 12);
    await db.insert(usersTable).values({
      id: randomUUID(),
      name: "Admin",
      email: "admin@gamingzone.com",
      passwordHash,
      role: "admin",
    });
    console.log("✓ Admin user created: admin@gamingzone.com / admin123");
  } else {
    console.log("✓ Admin user already exists");
  }

  const existingStaff = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, "staff@gamingzone.com"))
    .limit(1);

  if (existingStaff.length === 0) {
    const passwordHash = await bcrypt.hash("staff123", 12);
    await db.insert(usersTable).values({
      id: randomUUID(),
      name: "Staff Member",
      email: "staff@gamingzone.com",
      passwordHash,
      role: "staff",
    });
    console.log("✓ Staff user created: staff@gamingzone.com / staff123");
  }

  const existingDevices = await db.select().from(devicesTable).limit(1);
  if (existingDevices.length === 0) {
    const devices = [
      { name: "PS5 #1", type: "PS5", hourlyRate: "350" },
      { name: "PS5 #2", type: "PS5", hourlyRate: "350" },
      { name: "PS5 #3", type: "PS5", hourlyRate: "350" },
      { name: "PS5 #4", type: "PS5", hourlyRate: "350" },
      { name: "PS4 #1", type: "PS4", hourlyRate: "300" },
      { name: "PS4 #2", type: "PS4", hourlyRate: "300" },
      { name: "PS4 #3", type: "PS4", hourlyRate: "300" },
      { name: "PS4 #4", type: "PS4", hourlyRate: "300" },
      { name: "Gaming PC #1", type: "PC", hourlyRate: "400" },
      { name: "Gaming PC #2", type: "PC", hourlyRate: "400" },
      { name: "Gaming PC #3", type: "PC", hourlyRate: "400" },
      { name: "Gaming PC #4", type: "PC", hourlyRate: "400" },
    ];

    for (const d of devices) {
      await db.insert(devicesTable).values({
        id: randomUUID(),
        ...d,
        status: "available",
      });
    }
    console.log("✓ 12 devices created (4 PS5, 4 PS4, 4 Gaming PCs)");
  } else {
    console.log("✓ Devices already exist");
  }

  const existingSettings = await db.select().from(settingsTable).limit(1);
  if (existingSettings.length === 0) {
    await db.insert(settingsTable).values({
      id: randomUUID(),
      defaultHourlyRate: "350",
      currency: "PKR",
      businessName: "Gaming Zone",
      timezone: "Asia/Karachi",
    });
    console.log("✓ Default settings created");
  }

  console.log("Seeding complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
