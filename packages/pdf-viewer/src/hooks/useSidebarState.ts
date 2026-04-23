import { useCallback, useState } from "react";

export interface UseSidebarStateParams {
  enabled: boolean;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export interface UseSidebarStateReturn {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export function useSidebarState({
  enabled,
  defaultOpen = true,
  open,
  onOpenChange,
}: UseSidebarStateParams): UseSidebarStateReturn {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isControlled = open !== undefined;
  const nextOpen = isControlled ? open : uncontrolledOpen;
  const isSidebarOpen = enabled && nextOpen;

  const onToggleSidebar = useCallback(() => {
    if (!enabled) {
      return;
    }

    const updatedOpen = !nextOpen;
    if (!isControlled) {
      setUncontrolledOpen(updatedOpen);
    }
    onOpenChange?.(updatedOpen);
  }, [enabled, isControlled, nextOpen, onOpenChange]);

  return {
    isSidebarOpen: !!isSidebarOpen,
    onToggleSidebar,
  };
}
