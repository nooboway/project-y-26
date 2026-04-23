import { Router, type IRouter } from "express";
import healthRouter from "./health";
import siteRouter from "./site";
import daysRouter from "./days";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(siteRouter);
router.use(daysRouter);
router.use(adminRouter);

export default router;
