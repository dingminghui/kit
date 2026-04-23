import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * 查找包含 templateVersions 的 package.json 所在目录
 */
function findPackageRoot(): string {
  const startDir = path.dirname(fileURLToPath(import.meta.url));
  let searchDir = startDir;

  while (searchDir !== path.dirname(searchDir)) {
    const candidate = path.join(searchDir, "package.json");
    if (existsSync(candidate)) {
      const pkg = JSON.parse(readFileSync(candidate, "utf-8"));
      if (pkg.templateVersions) return searchDir;
    }
    searchDir = path.dirname(searchDir);
  }

  throw new Error(
    "无法找到 templateVersions 配置，请确认 package.json 中包含 templateVersions 字段",
  );
}

/**
 * 获取模板目录路径
 */
export function getTemplatesDir(): string {
  const pkgRoot = findPackageRoot();
  const distTemplates = path.join(pkgRoot, "dist", "templates");
  const srcTemplates = path.join(pkgRoot, "src", "templates");

  if (existsSync(distTemplates)) return distTemplates;
  if (existsSync(srcTemplates)) return srcTemplates;

  throw new Error(
    `未找到模板目录,请先执行 pnpm build。期望位置: ${distTemplates} 或 ${srcTemplates}`,
  );
}

/**
 * 读取 templateVersions 配置
 */
export function readVersions(): Record<string, string> {
  const pkgRoot = findPackageRoot();
  const pkgPath = path.join(pkgRoot, "package.json");
  const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
  return pkg.templateVersions;
}

/**
 * 处理模板文件，替换变量
 */
export function processTemplate(content: string, variables: Record<string, string>): string {
  let result = content;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replaceAll(`{{${key}}}`, value);
  }
  return result;
}
