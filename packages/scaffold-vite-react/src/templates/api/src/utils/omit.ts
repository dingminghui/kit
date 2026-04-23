export function omit<T extends object, K extends keyof T>(obj: T, keys: readonly K[]): Omit<T, K> {
  if (keys.length === 0) return { ...obj } as Omit<T, K>;
  const result = { ...obj };
  for (const key of keys) {
    if (key in result) {
      delete result[key as keyof typeof result];
    }
  }
  return result as Omit<T, K>;
}
