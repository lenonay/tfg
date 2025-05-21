import { Router } from "express";
import { HostsController } from "../controllers/HostsController.js";

export const HostsRouter = Router();

HostsRouter.get("/class/:className", HostsController.getByClass);

HostsRouter.get("/reload/:className", HostsController.reloadClass);