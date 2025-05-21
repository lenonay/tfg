import { execSync } from "node:child_process";

import { ClassesMySQL } from "../models/classesMySQL.js";
import { getActiveHosts } from "../models/hostsFping.js";
import { validateIP } from "../validators/ip.js";
import { sepiaScript } from "../utils/sepiaScript.js";

export class HostsController {
  static async getByClass(req, res) {
    const { className } = req.params;

    const hasNet = await ClassesMySQL.getClassNet(className);

    if (!hasNet.success) {
      return res.send(hasNet);
    }

    const hostsDB = await ClassesMySQL.getHosts(hasNet.classID);

    if (!hostsDB.success) {
      return res.json(hostsDB);
    }

    return res.json({
      success: true,
      hosts: hostsDB.data,
      network: hasNet.network,
    });
  }

  static async reloadClass(req, res) {
    // 1. Obtenemos la direccion de red de la clase
    const { className } = req.params;

    const hasNet = await ClassesMySQL.getClassNet(className);

    if (!hasNet.success) {
      return res.send(hasNet);
    }

    // 2. Obtenemos los hosts activos
    const hosts = getActiveHosts(hasNet.network);

    // 3. Verificamos cuales estan bloqueados y creamos un objeto
    const statuses = [];

    // Iteramos para verificar que tipo de bloqueo tiene
    for (const host of hosts.hosts) {
      const string = execSync(`bash ./scripts/sepia.sh campus-status ${host}`, {
        encoding: "utf-8",
      });

      statuses.push({
        blocked: resolveStatus(string),
        ip: host,
      });
    }

    if (statuses.length < 1) {
      return res.json({ success: true, updated: 0 });
    }

    // 4. GUardamos en la base de datos
    const dbResult = await ClassesMySQL.insertHosts(statuses, hasNet.classID);

    res.send(dbResult);
  }

  static async unblock(req, res) {
    // 1. Extraer el host
    const { host } = req.params;
    // 1.1 Validamos que sea una ip
    const validate = validateIP(host);

    if (!validate.success) {
      return res.status(400).send();
    }

    // 2. Bloqueamos la IP
    sepiaScript("unblock", host);

    // 3. Actualizar la DB
    const DBResult = ClassesMySQL.updateHost(host, 0);

    res.send(DBResult);
  }

  static async block(req, res) {
    // 1. Extraer el host
    const { host } = req.params;
    // 1.1 Validamos que sea una ip
    const validate = validateIP(host);

    if (!validate.success) {
      return res.status(400).send();
    }

    // 2. Bloqueamos la IP
    sepiaScript("block", host);

    // 3. Actualizar la DB
    const DBResult = ClassesMySQL.updateHost(host, 1);

    res.send(DBResult);
  }

  static async cBlock(req, res) {
    // 1. Extraer el host
    const { host } = req.params;
    // 1.1 Validamos que sea una ip
    const validate = validateIP(host);

    if (!validate.success) {
      return res.status(400).send();
    }

    // 2. Bloqueamos la IP
    sepiaScript("campus-block", host);

    // 3. Actualizar la DB
    const DBResult = await ClassesMySQL.updateHost(host, 2);

    res.send(DBResult);
  }

  static async delete(req, res) {
    // 1. Extraer el host
    const { host } = req.params;
    // 1.1 Validamos que sea una ip
    const validate = validateIP(host);

    if (!validate.success) {
      return res.status(400).send();
    }

    // 2. Desbloqueamos la IP
    sepiaScript("unlock", host);

    // 3. Borramos en la DB
    const DBResult = await ClassesMySQL.deleteHost(host);

    res.send(DBResult);
  }

  static async blockAll(req, res) {
    const { className } = req.params;

    processAll(res, className, "block", 1);
  }

  static async unblockAll(req, res) {
    const { className } = req.params;

    processAll(res, className, "unblock", 0);
  }

  static async cBlockAll(req, res) {
    const { className } = req.params;

    processAll(res, className, "campus-block", 2);
  }
}

function resolveStatus(status) {
  if (status.includes("Modo campus no activado para")) {
    return 0;
  }

  // Partimos en líneas y quitamos las vacías
  const lines = status
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "");

  // 1 = activado, pero sin rutas extra
  if (lines.length === 1) {
    return 1;
  }

  // 2 = activado y con rutas extra (bloqueo campus)
  return 2;
}

async function processAll(res, className, mode, state) {
  // Compramos que sea una clase
  const hasNet = await ClassesMySQL.getClassNet(className);

  if (!hasNet.success) {
    return res.json(hasNet);
  }

  // Recuperamos los hosts
  const hostsDB = await ClassesMySQL.getHosts(hasNet.classID);

  if (!hostsDB.success) {
    return res.json(hostsDB);
  }

  try {
    for (const host of hostsDB.data) {
      // 1. Revisamos si no está desbloqueado ya
      if (host.blocked == state) continue; // Si esta desbloqueado seguimos

      // 2. Desbloqueamos la IP
      sepiaScript(mode, host.ip);

      // 3. Actualizamos la DB
      ClassesMySQL.updateHost(host.ip, state);
    }
    return res.json({ success: true });
  } catch (e) {
    console.log(e);
    return res.json({ success: false });
  }
}
