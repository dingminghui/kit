import { spawn } from "node:child_process";

export function installDependencies(targetDir: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn("pnpm", ["install"], {
      cwd: targetDir,
      stdio: ["ignore", "inherit", "inherit"],
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`pnpm install 退出码: ${code}`));
      }
    });

    child.on("error", reject);
  });
}
