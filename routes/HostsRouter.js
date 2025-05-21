import { Router } from "express";

import { auth } from "../middlewares/auth.js";
import { HostsController } from "../controllers/HostsController.js";

export const HostsRouter = Router();

// HostsRouter.use(auth);

HostsRouter.get("/class/:className", HostsController.getByClass);

HostsRouter.get("/reload/:className", HostsController.reloadClass);

// Opciones por clase
HostsRouter.put("/all/block/:className", HostsController.blockAll);
HostsRouter.put("/all/unblock/:className", HostsController.unblockAll);
HostsRouter.put("/all/c-block/:className", HostsController.cBlockAll);

// Opciones singulares
HostsRouter.put("/unblock/:host", HostsController.unblock);

HostsRouter.put("/block/:host", HostsController.block);

HostsRouter.put("/c-block/:host", HostsController.cBlock);

HostsRouter.put("/delete/:host", HostsController.delete);
