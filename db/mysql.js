import mysql from "mysql2/promise";
import crypto from "node:crypto";
import bcrypt from "bcrypt";

import {
  DB_DB,
  DB_HOST,
  DB_USER,
  DB_PORT,
  DB_PASSWD,
  USERNAME,
  PASSWD,
  SALT,
} from "../config.js";
import { UUIDParser } from "../utils/uuidParser.js";

export async function createDBConnection() {
  return await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWD,
    database: DB_DB,
    dateStrings: true,
  });
}

export async function InitDB() {
  const con = await createDBConnection();
  try {
    // Vemos si hay usarios en la base de datos
    const [result] = await con.query("SELECT * FROM users");

    // Si ya hay usuarios salimos
    if (result.length > 0) {
      return;
    }

    // Si no, metemos uno por defecto
    await con.execute("INSERT INTO users VALUE(?,?,?)", [
      UUIDParser.UUIDToBin(crypto.randomUUID()),
      USERNAME,
      bcrypt.hashSync(PASSWD, Number(SALT))
    ]);

    // Mostramos la salida por consola
    console.log("[+] Usuario por defecto creado");
  } catch (e) {
    console.log(e);
  } finally {
    con.end();
  }
}
