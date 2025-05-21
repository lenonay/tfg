import { Router } from "express";

import { AccountController } from "../controllers/AccountController.js";
import { auth } from "../middlewares/auth.js";

export const AccountRouter = Router();

// Login y logout
AccountRouter.post("/login", AccountController.login);
AccountRouter.post("/logout", AccountController.logout);

AccountRouter.use(auth)

// Manejo de cuentas
AccountRouter.post("/", AccountController.create);
AccountRouter.delete("/:id", AccountController.delete);
AccountRouter.get("/all", AccountController.getAll);
