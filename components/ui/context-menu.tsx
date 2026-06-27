"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ContextMenuPosition {
  x: number;
  y: number;
}

export interface ContextMenuItem {
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  variant?: "default" | "danger" | "success";
  disabled?: boolean;
  divider?: boolean;
  shortcut?: string;
}

interface ContextMenuProps {
  items: ContextMenuItem[];
  children: React.ReactElement;
  disabled?: boolean;
}

export function ContextMenu({ items, children, disabled = false }: ContextMenuProps) {
  const [visible, setVisible] = React.useState(false);
  const [position, setPosition] = React.useState<ContextMenuPosition>({ x: 0, y: 0 });
  const [mounted, setMounted] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const handleContextMenu = React.useCallback(
    (e: React.MouseEvent) => {
      if (disabled) return;

      e.preventDefault();
      e.stopPropagation();

      const { clientX, clientY } = e;
      const menuWidth = 220;
      const menuHeight = items.length * 40 + 16;

      // Adjust position to keep menu in viewport
      let x = clientX;
      let y = clientY;

      if (clientX + menuWidth > window.innerWidth) {
        x = window.innerWidth - menuWidth - 8;
      }

      if (clientY + menuHeight > window.innerHeight) {
        y = window.innerHeight - menuHeight - 8;
      }

      setPosition({ x, y });
      setVisible(true);
    },
    [items.length, disabled]
  );

  const handleClickOutside = React.useCallback((e: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
      setVisible(false);
    }
  }, []);

  const handleEscape = React.useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") {
      setVisible(false);
    }
  }, []);

  React.useEffect(() => {
    if (visible) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("keydown", handleEscape);
      };
    }
  }, [visible, handleClickOutside, handleEscape]);

  const handleItemClick = (item: ContextMenuItem) => {
    if (item.disabled) return;
    item.onClick();
    setVisible(false);
  };

  // Inject onContextMenu directly onto the child so the component can wrap
  // non-container elements like <tr> without producing invalid HTML
  // (a <div> inside a <tbody> would break the table layout).
  const trigger = React.isValidElement(children)
    ? React.cloneElement(children as React.ReactElement, {
        onContextMenu: handleContextMenu,
      })
    : children;

  const menu = visible && mounted ? (
    createPortal(
      <div
        ref={menuRef}
        className={cn(
          "fixed z-[9999] min-w-[220px] rounded-lg border border-border bg-popover shadow-lg",
          "animate-in fade-in-0 zoom-in-95 slide-in-from-top-1 duration-200"
        )}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
        }}
      >
        <div className="p-2 space-y-0.5">
          {items.map((item, index) => {
            const Icon = item.icon;
            const showDivider = item.divider && index < items.length - 1;

            return (
              <React.Fragment key={index}>
                <button
                  onClick={() => handleItemClick(item)}
                  disabled={item.disabled}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-150",
                    "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none",
                    "disabled:opacity-50 disabled:pointer-events-none",
                    item.variant === "danger" &&
                      "text-destructive hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10",
                    item.variant === "success" &&
                      "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 focus:bg-emerald-500/10"
                  )}
                >
                  {Icon && (
                    <Icon
                      className={cn(
                        "h-4 w-4 flex-shrink-0",
                        item.variant === "danger" && "text-destructive",
                        item.variant === "success" && "text-emerald-600 dark:text-emerald-400"
                      )}
                    />
                  )}
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.shortcut && (
                    <span className="text-xs text-muted-foreground/70 font-mono">
                      {item.shortcut}
                    </span>
                  )}
                </button>
                {showDivider && <div className="h-px bg-border my-1" />}
              </React.Fragment>
            );
          })}
        </div>
      </div>,
      document.body
    )
  ) : null;

  return (
    <>
      {trigger}
      {menu}
    </>
  );
}
