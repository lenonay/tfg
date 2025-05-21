import { Router } from "express";

import { AccountController } from "../controllers/AccountController.js";

export const AccountRouter = Router();

AccountRouter.post("/login", AccountController.login);

AccountRouter.delete("/login", AccountController.logout);
