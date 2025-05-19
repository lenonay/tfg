import { Router } from "express";

import { auth } from "../middlewares/auth.js";

export const panelRouter = Router();

// Limitamos el acceso
panelRouter.use(auth)

panelRouter.get("/", (req, res) => {
  res.sendFile("panel.html", { root: "./views" });
});
