import { execSync } from "node:child_process";

import { ClassesMySQL } from "../models/classesMySQL.js";
import { getActiveHosts } from "../models/hostsFping.js";

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

    // 4. GUardamos en la base de datos
    const dbResult = await ClassesMySQL.insertHosts(statuses, hasNet.classID);

    res.send(dbResult);
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
