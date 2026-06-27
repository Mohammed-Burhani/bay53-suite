import { useState, useCallback } from "react";
import { ContextMenuItem } from "@/components/ui/context-menu";

interface UseContextMenuOptions<T> {
  items: (data: T) => ContextMenuItem[];
}

export function useContextMenu<T>({ items }: UseContextMenuOptions<T>) {
  const [selectedData, setSelectedData] = useState<T | null>(null);

  const getMenuItems = useCallback(
    (data: T): ContextMenuItem[] => {
      return items(data);
    },
    [items]
  );

  const handleContextMenu = useCallback((data: T) => {
    setSelectedData(data);
  }, []);

  return {
    selectedData,
    getMenuItems,
    handleContextMenu,
  };
}
