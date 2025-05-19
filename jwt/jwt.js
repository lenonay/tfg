import jwt from "jsonwebtoken";

import { JWT_SECRET } from "../config.js";

export class JWT {
  static create(payload) {
    // Creamos un token que expire a las 6 horas
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "6 hours" });

    return token;
  }

  static validate(token) {
    try {
      // Intentamos validar el token
      const sessionData = jwt.verify(token, JWT_SECRET);

      // En caso de tener datos
      if (sessionData) {
        // Extraemos los datos
        const {iat, exp, ...data} = sessionData;
        // Los retornamos
        return data
      } else {
        // Retornamos nulo si no hay
        return null;
      }
    } catch {
      // Si hubo un fallo o está expirado retornamos null
      return null;
    }
  }
}
