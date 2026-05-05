import express from "express";
import healthRouter from "./health.js";
import siteRouter from "./site.js";
import daysRouter from "./days.js";
import adminRouter from "./admin.js";
import uploadRouter from "./upload.js";

const router = express.Router();

router.use(healthRouter);
router.use(siteRouter);
router.use(daysRouter);
router.use(adminRouter);
router.use(uploadRouter);

export default router;
