import { spawnSync } from "node:child_process";
import { access, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import process from "node:process";
import { generateProject } from "../src/generator.js";

const features = process.argv.slice(2);
const originalDirectory = process.cwd();
const directory = await mkdtemp(path.join(tmpdir(), "kit-scaffold-"));
const projectName = "template-check";
const projectDirectory = path.join(directory, projectName);

function runPnpm(...args: string[]): void {
  const result = spawnSync("pnpm", args, { cwd: projectDirectory, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`pnpm ${args.join(" ")} failed (${result.signal ?? result.status})`);
  }
}

try {
  process.chdir(directory);
  await generateProject({ projectName, description: "Scaffold verification", features });

  if (features.includes("msw")) {
    await access(path.join(projectDirectory, "public", "mockServiceWorker.js"));
  }

  if (features.includes("playwright")) {
    const installOptions = process.env.GITHUB_ACTIONS === "true" ? ["--with-deps"] : [];
    runPnpm("exec", "playwright", "install", "--only-shell", ...installOptions, "chromium");
  }

  runPnpm("run", "validate");
  runPnpm("run", "build");
} finally {
  process.chdir(originalDirectory);
  await rm(directory, { recursive: true, force: true });
}
