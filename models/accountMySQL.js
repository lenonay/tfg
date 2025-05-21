import { createDBConnection } from "../db/mysql.js";
import { UUIDParser } from "../utils/uuidParser.js";

export class AccountMySQL {
  static async checkUser(data) {
    // 1. Extraemos los datos
    const { username } = data;
    // 2. Creamos la conexion a la DB
    const con = await createDBConnection();
    // 3. Extraemos los datos del usuario
    try {
      // Buscamos en la DB el usuario
      const [result] = await con.query(
        "SELECT * FROM users WHERE username = ?",
        [username]
      );

      // Si no tenemos un usuario enviamos un error
      if (result.length !== 1) {
        return { success: false, error: "Credenciales inválidas" };
      }

      // Procesamos los datos para transformar el ID
      const data = result.map((row) => {
        return { ...row, id: UUIDParser.binToUUID(row.id) };
      });

      // Enviamos estado correcto junto con los datos para procesar la contraseña
      return { success: true, data: data[0] };
    } catch (e) {
      // Si hubo un error, enviamos el error al front
      console.log(e);
      return { success: false, error: "Hubo un error con las credenciales" };
    } finally {
      // Cerramos la conexión con la DB
      con.end();
    }
  }

  static async getAll() {
    const con = await createDBConnection();

    try {
      const [rows] = await con.query("SELECT id, username FROM users");

      const users = rows.map((row) => {
        return { ...row, id: UUIDParser.binToUUID(row.id) };
      });

      return { success: true, users };
    } catch (e) {
      console.log(e);

      return { success: false, error: "Hubo un error al procesar los datos" };
    } finally {
      con.end();
    }
  }

  static async create(id, username, passwd) {
    const con = await createDBConnection();

    try {
      const [result] = await con.execute("INSERT INTO users VALUES (?,?,?)", [
        UUIDParser.UUIDToBin(id),
        username,
        passwd,
      ]);

      return { success: true };
    } catch (error) {
      console.log(error);
      return { success: false, error: "Hubo un error al crear el usuario" };
    } finally {
      con.end();
    }
  }

  static async lastUser() {
    const con = await createDBConnection();

    try {
      const [rows] = await con.query("SELECT id FROM users");

      const last = rows.length == 1;

      return { success: true, last };
    } catch (e) {
      return {
        success: false,
        error: "Hubo un error durante el proceso de los datos",
      };
    } finally {
    }
  }

  static async delete(id) {
    const con = await createDBConnection();

    try {
      await con.execute("DELETE FROM users WHERE id = ?", [
        UUIDParser.UUIDToBin(id),
      ]);

      return { success: true };
    } catch (e) {
      console.log(e);
      return { success: false, error: "Hubo un error al borar al usuario" };
    } finally {
      con.end();
    }
  }
}
