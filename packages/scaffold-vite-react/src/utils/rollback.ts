import fs from "fs-extra";

export class Rollback {
  private readonly directories: string[] = [];

  addDirectory(dir: string): void {
    this.directories.push(dir);
  }

  async execute(): Promise<void> {
    await Promise.all(
      this.directories.reverse().map(async (dir) => {
        try {
          await fs.remove(dir);
        } catch {
          // 忽略删除失败的情况，因为可能是权限问题或目录已被删除
        }
      }),
    );
  }
}
