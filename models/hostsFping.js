import { execSync } from "node:child_process";

export function getActiveHosts(network) {
  try {
    const output = execSync(`fping -a -g ${network} 2>/dev/null`, {
      encoding: "utf-8",
    });

    const activeHosts = output
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line !== "");

    return { hosts: activeHosts };
  } catch (err) {
    // Aunque fping retorne status 1, stdout contiene los hosts activos
    const output = err.stdout?.toString() || "";
    const activeHosts = output
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line !== "");

    return { success: true, hosts: activeHosts, network };
  }
}
