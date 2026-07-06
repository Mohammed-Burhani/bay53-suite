"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { LucideIcon, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ContextMenuPosition {
  x: number;
  y: number;
}

export interface ContextMenuItem {
  label: string;
  icon?: LucideIcon;
  onClick?: () => void;
  variant?: "default" | "danger" | "success";
  disabled?: boolean;
  divider?: boolean;
  shortcut?: string;
  submenu?: ContextMenuItem[];
  onSubmenuOpen?: () => Promise<ContextMenuItem[]>; // Lazy load submenu
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
  const [activeSubmenu, setActiveSubmenu] = React.useState<number | null>(null);
  const [submenuPosition, setSubmenuPosition] = React.useState<ContextMenuPosition>({ x: 0, y: 0 });
  const [submenuItems, setSubmenuItems] = React.useState<ContextMenuItem[]>([]);
  const [loadingSubmenu, setLoadingSubmenu] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const submenuRef = React.useRef<HTMLDivElement>(null);
  const submenuTimerRef = React.useRef<NodeJS.Timeout | null>(null);

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
    if (
      menuRef.current && !menuRef.current.contains(e.target as Node) &&
      submenuRef.current && !submenuRef.current.contains(e.target as Node)
    ) {
      setVisible(false);
      setActiveSubmenu(null);
    }
  }, []);

  const handleEscape = React.useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") {
      if (activeSubmenu !== null) {
        setActiveSubmenu(null);
      } else {
        setVisible(false);
      }
    }
  }, [activeSubmenu]);

  React.useEffect(() => {
    if (visible) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("keydown", handleEscape);
        if (submenuTimerRef.current) {
          clearTimeout(submenuTimerRef.current);
        }
      };
    }
  }, [visible, handleClickOutside, handleEscape]);

  const handleItemClick = (item: ContextMenuItem) => {
    if (item.disabled) return;
    if (item.onClick) {
      item.onClick();
      setVisible(false);
      setActiveSubmenu(null);
    }
  };

  const handleSubmenuHover = async (index: number, item: ContextMenuItem, buttonRect: DOMRect) => {
    // Clear any pending submenu close
    if (submenuTimerRef.current) {
      clearTimeout(submenuTimerRef.current);
      submenuTimerRef.current = null;
    }

    setActiveSubmenu(index);
    
    // Calculate submenu position
    const submenuWidth = 220;
    const x = buttonRect.right + 4; // 4px gap
    let y = buttonRect.top;

    // Adjust if goes off screen
    if (x + submenuWidth > window.innerWidth) {
      // Show on left side instead
      setSubmenuPosition({ x: buttonRect.left - submenuWidth - 4, y });
    } else {
      setSubmenuPosition({ x, y });
    }

    // Load submenu items
    if (item.onSubmenuOpen) {
      setLoadingSubmenu(true);
      try {
        const loadedItems = await item.onSubmenuOpen();
        setSubmenuItems(loadedItems);
      } catch (error) {
        console.error("Failed to load submenu:", error);
        setSubmenuItems([]);
      } finally {
        setLoadingSubmenu(false);
      }
    } else if (item.submenu) {
      setSubmenuItems(item.submenu);
    } else {
      setSubmenuItems([]);
    }
  };

  const handleSubmenuLeave = () => {
    // Delay closing submenu for smoother UX
    submenuTimerRef.current = setTimeout(() => {
      setActiveSubmenu(null);
      setSubmenuItems([]);
    }, 150);
  };

  const handleSubmenuEnter = () => {
    // Cancel pending close
    if (submenuTimerRef.current) {
      clearTimeout(submenuTimerRef.current);
      submenuTimerRef.current = null;
    }
  };

  // Inject onContextMenu directly onto the child so the component can wrap
  // non-container elements like <tr> without producing invalid HTML
  // (a <div> inside a <tbody> would break the table layout).
  const trigger = React.isValidElement(children)
    ? React.cloneElement(
        children as React.ReactElement<{ onContextMenu?: React.MouseEventHandler }>,
        { onContextMenu: handleContextMenu }
      )
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
            const hasSubmenu = !!(item.submenu || item.onSubmenuOpen);

            return (
              <React.Fragment key={index}>
                <button
                  onClick={() => !hasSubmenu && handleItemClick(item)}
                  onMouseEnter={(e) => {
                    if (hasSubmenu) {
                      const rect = e.currentTarget.getBoundingClientRect();
                      handleSubmenuHover(index, item, rect);
                    } else {
                      handleSubmenuLeave();
                    }
                  }}
                  disabled={item.disabled}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-150",
                    "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none",
                    "disabled:opacity-50 disabled:pointer-events-none",
                    activeSubmenu === index && "bg-accent text-accent-foreground",
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
                  {hasSubmenu && (
                    <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  )}
                  {!hasSubmenu && item.shortcut && (
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

  const submenu = activeSubmenu !== null && mounted ? (
    createPortal(
      <div
        ref={submenuRef}
        onMouseEnter={handleSubmenuEnter}
        onMouseLeave={handleSubmenuLeave}
        className={cn(
          "fixed z-[10000] min-w-[220px] rounded-lg border border-border bg-popover shadow-lg",
          "animate-in fade-in-0 zoom-in-95 slide-in-from-left-1 duration-150"
        )}
        style={{
          left: `${submenuPosition.x}px`,
          top: `${submenuPosition.y}px`,
        }}
      >
        <div className="p-2 space-y-0.5">
          {loadingSubmenu ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : submenuItems.length === 0 ? (
            <div className="px-3 py-2.5 text-sm text-muted-foreground">
              No options available
            </div>
          ) : (
            submenuItems.map((subItem, subIndex) => {
              const SubIcon = subItem.icon;
              return (
                <button
                  key={subIndex}
                  onClick={() => handleItemClick(subItem)}
                  disabled={subItem.disabled}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-150",
                    "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none",
                    "disabled:opacity-50 disabled:pointer-events-none",
                    subItem.variant === "danger" &&
                      "text-destructive hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10",
                    subItem.variant === "success" &&
                      "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 focus:bg-emerald-500/10"
                  )}
                >
                  {SubIcon && (
                    <SubIcon
                      className={cn(
                        "h-4 w-4 flex-shrink-0",
                        subItem.variant === "danger" && "text-destructive",
                        subItem.variant === "success" && "text-emerald-600 dark:text-emerald-400"
                      )}
                    />
                  )}
                  <span className="flex-1 text-left">{subItem.label}</span>
                </button>
              );
            })
          )}
        </div>
      </div>,
      document.body
    )
  ) : null;

  return (
    <>
      {trigger}
      {menu}
      {submenu}
    </>
  );
}
