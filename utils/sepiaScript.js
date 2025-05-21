import { execSync } from "node:child_process";

export function sepiaScript(mode, ip) {
  try {
    return execSync(`bash ./scripts/sepia.sh ${mode} ${ip}`, {
      encoding: "utf-8",
    });
  } catch (e) {
    return e;
  }
}
