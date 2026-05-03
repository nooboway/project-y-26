import express from "express";
import healthRouter from "./health";
import siteRouter from "./site";
import daysRouter from "./days";
import adminRouter from "./admin";
import uploadRouter from "./upload";

const router = express.Router();

router.use(healthRouter);
router.use(siteRouter);
router.use(daysRouter);
router.use(adminRouter);
router.use(uploadRouter);

export default router;
