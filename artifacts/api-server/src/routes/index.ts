import { Router } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import devicesRouter from "./devices.js";
import sessionsRouter from "./sessions.js";
import reportsRouter from "./reports.js";
import settingsRouter from "./settings.js";

const router = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/devices", devicesRouter);
router.use("/sessions", sessionsRouter);
router.use("/reports", reportsRouter);
router.use("/settings", settingsRouter);

export default router;
