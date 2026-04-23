/**
 * 命令接口定义
 */
export interface Command {
  /** 命令名称 */
  name: string;
  /** 命令描述 */
  description: string;
  /** 命令用法 */
  usage: string;
  /** 命令执行函数 */
  execute: (args: string[]) => Promise<void>;
}
