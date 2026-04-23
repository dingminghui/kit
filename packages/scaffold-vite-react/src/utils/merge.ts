import fs from "fs-extra";

interface PackageJsonExtras {
  dependencies?: Record<string, boolean | string>;
  devDependencies?: Record<string, boolean | string>;
  scripts?: Record<string, string>;
}

export async function mergePackageJsonExtras(
  packageJsonPath: string,
  extras: PackageJsonExtras,
  versions: Record<string, string>,
): Promise<void> {
  const pkg = (await fs.readJson(packageJsonPath)) as Record<string, unknown>;

  if (extras.dependencies) {
    const deps = (pkg.dependencies ?? {}) as Record<string, string>;
    for (const [name, value] of Object.entries(extras.dependencies)) {
      const version = value === true ? versions[name] : String(value);
      if (!version) {
        throw new Error(`版本信息未找到: ${name}`);
      }
      deps[name] = version;
    }
    pkg.dependencies = deps;
  }

  if (extras.devDependencies) {
    const devDeps = (pkg.devDependencies ?? {}) as Record<string, string>;
    for (const [name, value] of Object.entries(extras.devDependencies)) {
      const version = value === true ? versions[name] : String(value);
      if (!version) {
        throw new Error(`版本信息未找到: ${name}`);
      }
      devDeps[name] = version;
    }
    pkg.devDependencies = devDeps;
  }

  if (extras.scripts) {
    const scripts = (pkg.scripts ?? {}) as Record<string, string>;
    for (const [name, value] of Object.entries(extras.scripts)) {
      if (name.startsWith("+")) {
        const realName = name.slice(1);
        if (scripts[realName]) {
          scripts[realName] = `${scripts[realName]} && ${value}`;
        } else {
          scripts[realName] = value;
        }
      } else {
        scripts[name] = value;
      }
    }
    pkg.scripts = scripts;
  }

  await fs.writeJson(packageJsonPath, pkg, { spaces: "\t" });
}
