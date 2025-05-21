import bcrypt from "bcrypt";
import crypto from "node:crypto";

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
        path: "/",
      })
      // Enviamos un success
      .send({ success: true });
  }

  static logout(req, res) {
    res
      .clearCookie("token") // Boramos la cookie
      .send();
  }

  static async create(req, res) {
    const validate = UserValidator.login(req.body);

    if (!validate.success) {
      return res.json(validate);
    }

    // 2. Revisamos que no exista ya
    const exists = await AccountMySQL.checkUser(validate.data);

    if (exists.success) {
      return res.json({ success: false, error: "Ese usuario ya existe" });
    }

    const dbResult = await AccountMySQL.create(
      crypto.randomUUID(),
      validate.data.username,
      bcrypt.hashSync(validate.data.passwd, Number(SALT))
    );

    res.json(dbResult);
  }

  static async delete(req, res) {
    const { id } = req.params;

    const lastUser = await AccountMySQL.lastUser();

    if (!lastUser.success) {
      return res.json(lastUser);
    }

    if (lastUser.last) {
      return res.json({
        success: false,
        error: "No se puede eliminar el último usuario",
      });
    }

    const dbResult = await AccountMySQL.delete(id); 

    res.json(dbResult);
  }

  static async getAll(req, res) {
    // Recuperamos todos los usuarios
    const dbResult = await AccountMySQL.getAll();

    res.json(dbResult);
  }
}
