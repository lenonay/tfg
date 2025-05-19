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
}
