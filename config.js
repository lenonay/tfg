import { InitDB } from "./db/mysql.js";

process.loadEnvFile(".env");

export const {
  INT,
  PORT,
  SALT,
  DB_HOST,
  DB_PORT,
  DB_USER,
  DB_PASSWD,
  DB_DB,
  USERNAME,
  PASSWD,
  JWT_SECRET
} = process.env;

InitDB();
