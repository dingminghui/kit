import { useRef } from "react";

function areHookDepsEqual(previous: readonly unknown[], next: readonly unknown[]): boolean {
  if (previous.length !== next.length) {
    return false;
  }

  return previous.every((value, index) => Object.is(value, next[index]));
}

export function useStableHookValue<T>(nextValue: T, deps: readonly unknown[]): T {
  const valueRef = useRef<{ deps: readonly unknown[]; value: T } | null>(null);

  if (valueRef.current === null || !areHookDepsEqual(valueRef.current.deps, deps)) {
    valueRef.current = {
      deps: [...deps],
      value: nextValue,
    };
  }

  return valueRef.current.value;
}

export function useShallowStableObject<T extends object | undefined>(value: T): T {
  const valueRef = useRef<T>(value);
  const previousValue = valueRef.current;

  if (value === undefined || previousValue === undefined) {
    valueRef.current = value;
    return valueRef.current;
  }

  const previousEntries = Object.entries(previousValue as Record<string, unknown>);
  const nextEntries = Object.entries(value as Record<string, unknown>);
  const isSameObject =
    previousEntries.length === nextEntries.length &&
    nextEntries.every(([key, nextValue]) =>
      Object.is((previousValue as Record<string, unknown>)[key], nextValue),
    );

  if (!isSameObject) {
    valueRef.current = value;
  }

  return valueRef.current;
}
