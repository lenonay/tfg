import e from "express";
import cookieParser from "cookie-parser";

import { INT, PORT } from "./config.js";
import { session } from "./middlewares/session.js";
import { AccountRouter } from "./routes/AccountRouter.js";
import { panelRouter } from "./routes/panelRouter.js";

const app = e();

app.disable("x-powered-by");
app.use(e.json());
app.use(cookieParser());
// Middlewares custom
app.use(session)

// Directorio estático
app.use("/public", e.static("./public"));

// Icono
app.get("/favicon.ico", (_, res) => {
  res.sendFile("logo.webp", { root: "./public/images" })
})

app.get("/", (req, res) => {
  if(req.session) {
    res.redirect("/panel");
    return;
  }

  res.sendFile("login.html", { root: "./views" });
});

app.use("/panel", panelRouter)

app.use("/account", AccountRouter);

app.listen(PORT, INT, () => {
  console.log("Server listening on:", INT, PORT);
});
