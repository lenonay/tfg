import { JWT } from "../jwt/jwt.js";

export function session(req, res, next) {
  // 1. Extraemos el token de las cookies
  const { token } = req.cookies;

  // Si no tenemos token no hay sesion
  if(!token) {
    req.session == null,
    next();
    return;
  }

  // Asignamos la sesion desde el token
  req.session = JWT.validate(token);

  // Continuamos
  next();
}
