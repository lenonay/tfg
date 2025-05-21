import bcrypt from "bcrypt";

import { SALT } from "../config.js";

import { AccountMySQL } from "../models/accountMySQL.js";
import { UserValidator } from "../validators/user.js";
import { JWT } from "../jwt/jwt.js";

export class AccountController {
  static async login(req, res) {
    // 1. Verificamos que nos ha llegado los campos correctos
    const validateFields = UserValidator.login(req.body);

    // Si no hay exito en la validación enviamos el error al frontend
    if (!validateFields.success) {
      res.json({ success: false, error: validateFields.error });
      return;
    }

    // 2. verificamos que el usuario existe en la DB
    const userDB = await AccountMySQL.checkUser(validateFields.data);

    // Si hubo un erro lo enviamos al front
    if (!userDB.success) {
      res.json(userDB);
      return;
    }

    // 3. Verificamos que la contraseña sea correcta
    const validPasswd = bcrypt.compareSync(
      validateFields.data.passwd,
      userDB.data.passwd,
      Number(SALT)
    );

    if (!validPasswd) {
      res.json({ success: false, error: "Credenciales inválidas" });
      return;
    }
    // 4. Creamos los datos de sesión
    // Extraemos el hash de la contraseña para no enviarla
    const { passwd, ...sessionData } = userDB.data;

    const token = JWT.create(sessionData);

    // 5. Enviamos el JWT
    res
      // Asignamos el token a la cookie
      .cookie("token", token, {
        maxAge: 1000 * 60 * 60 * 6,
        httpOnly: true,
        path: "/"
      })
      // Enviamos un success
      .send({ success: true });
  }

  static logout(req, res) {
    res
      .clearCookie('token') // Boramos la cookie
      .send()
  }
}
