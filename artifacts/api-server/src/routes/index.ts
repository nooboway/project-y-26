import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import siteRouter from "./site.js";
import daysRouter from "./days.js";
import adminRouter from "./admin.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(siteRouter);
router.use(daysRouter);
router.use(adminRouter);

export default router;
