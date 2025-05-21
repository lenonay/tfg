import { createDBConnection } from "../db/mysql.js";

export class ClassesMySQL {
  static async getClassNet(className) {
    const con = await createDBConnection();

    try {
      const [query] = await con.query(
        "SELECT network, id FROM classes WHERE class = ?",
        [className]
      );

      if (query.length !== 1) {
        return { success: false, error: "Esa clase no existe" };
      }

      return { success: true, classID: query[0].id, network: query[0].network };
    } catch (e) {
      console.log(e);

      return { success: false, error: "Hubo un error al procesar la clase" };
    } finally {
      con.end();
    }
  }

  static async insertHosts(statuses, classID) {
    const con = await createDBConnection();
    try {
      // Construir array de tuplas
      const values = statuses.map((s) => [s.ip, classID, s.blocked]);

      // El placeholder VALUES ? permite bulk insert
      const sql = `
        INSERT INTO hosts (ip, class_id, blocked)
        VALUES ?
        ON DUPLICATE KEY UPDATE
          class_id = VALUES(class_id),
          blocked  = VALUES(blocked)
      `;

      await con.query(sql, [values]);
    } catch (e) {
      console.error(e);
      return { success: false, error: "Error al guardar en BD" };
    } finally {
      con.end();
    }

    return { success: true, updated: statuses.length };
  }

  static async getHosts(classID) {
    const con = await createDBConnection();

    try {
      const [query] = await con.query(
        "SELECT * FROM hosts WHERE class_id = ?",
        classID
      );

      return { success: true, data: query };
    } catch (e) {
      console.log(e);
      return { success: false, error: "Hubo un error procesando los datos" };
    } finally {
      con.end();
    }
  }

  static async updateHost(ip, blocked) {
    const con = await createDBConnection();

    try {
      const [update] = con.execute(
        "UPDATE hosts SET blocked = ? WHERE ip = ?",
        [blocked, ip]
      );

      return { success: true };
    } catch (e) {
      return { success: false };
    } finally {
      con.end();
    }
  }

  static async deleteHost(ip) {
    const con = await createDBConnection();

    try {
      await con.execute("DELETE FROM hosts WHERE ip = ?", [ip]);

      return { success: true };
    } catch (e) {
      console.log(e);
      return { success: false };
    } finally {
      con.end();
    }
  }
}
