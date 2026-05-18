"use client";

import { CheckIcon, ChevronRightIcon } from "lucide-react";
import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

type DropdownContextValue = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLElement | null>;
};

const DropdownContext = React.createContext<DropdownContextValue>({
  open: false,
  onOpenChange: () => {},
  triggerRef: { current: null },
});

function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLElement | null>(null);
  return (
    <DropdownContext.Provider
      value={{ open, onOpenChange: setOpen, triggerRef }}
    >
      {children}
    </DropdownContext.Provider>
  );
}

function DropdownMenuPortal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(children, document.body);
}

function DropdownMenuTrigger({
  asChild = false,
  children,
  onClick,
  ...props
}: React.ComponentProps<"button"> & { asChild?: boolean }) {
  const { open, onOpenChange, triggerRef } = React.useContext(DropdownContext);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onOpenChange(!open);
    (onClick as ((e: React.MouseEvent) => void) | undefined)?.(e);
  };

  if (asChild && React.isValidElement(children)) {
    // biome-ignore lint/suspicious/noExplicitAny: cloneElement requires dynamic props
    const child = children as React.ReactElement<any>;
    return React.cloneElement(child, {
      ref: (el: HTMLElement | null) => {
        triggerRef.current = el;
      },
      "aria-expanded": open,
      "aria-haspopup": "menu" as const,
      onClick: (e: React.MouseEvent) => {
        e.preventDefault();
        onOpenChange(!open);
        child.props.onClick?.(e);
      },
    });
  }

  return (
    <button
      ref={(el) => {
        triggerRef.current = el;
      }}
      type="button"
      data-slot="dropdown-menu-trigger"
      aria-expanded={open}
      aria-haspopup="menu"
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );
}

function DropdownMenuContent({
  align = "start",
  sideOffset = 4,
  className,
  children,
  ...props
}: Omit<React.ComponentProps<"div">, "align"> & {
  align?: "start" | "end" | "center";
  alignOffset?: number;
  side?: string;
  sideOffset?: number;
}) {
  const { open, onOpenChange, triggerRef } = React.useContext(DropdownContext);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [style, setStyle] = React.useState<React.CSSProperties>({});
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  React.useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const top = rect.bottom + sideOffset;
    if (align === "end") {
      setStyle({
        position: "fixed",
        top,
        right: window.innerWidth - rect.right,
      });
    } else if (align === "center") {
      setStyle({
        position: "fixed",
        top,
        left: rect.left + rect.width / 2,
        transform: "translateX(-50%)",
      });
    } else {
      setStyle({ position: "fixed", top, left: rect.left });
    }
  }, [open, align, sideOffset, triggerRef]);

  React.useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (
        !contentRef.current?.contains(e.target as Node) &&
        !triggerRef.current?.contains(e.target as Node)
      ) {
        onOpenChange(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onOpenChange(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, onOpenChange, triggerRef]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      ref={contentRef}
      data-slot="dropdown-menu-content"
      style={style}
      className={cn(
        "z-50 min-w-32 overflow-hidden rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10 animate-in fade-in-0 zoom-in-95",
        className,
      )}
      {...props}
    >
      {children}
    </div>,
    document.body,
  );
}

function DropdownMenuGroup({ ...props }: React.ComponentProps<"div">) {
  return <div data-slot="dropdown-menu-group" {...props} />;
}

function DropdownMenuLabel({
  className,
  inset,
  ...props
}: React.ComponentProps<"div"> & { inset?: boolean }) {
  return (
    <div
      data-slot="dropdown-menu-label"
      data-inset={inset}
      className={cn(
        "px-1.5 py-1 text-xs font-medium text-muted-foreground data-inset:pl-7",
        className,
      )}
      {...props}
    />
  );
}

function DropdownMenuItem({
  className,
  inset,
  variant = "default",
  onClick,
  ...props
}: React.ComponentProps<"button"> & {
  inset?: boolean;
  variant?: "default" | "destructive";
}) {
  const { onOpenChange } = React.useContext(DropdownContext);
  return (
    <button
      type="button"
      data-slot="dropdown-menu-item"
      data-inset={inset}
      data-variant={variant}
      className={cn(
        "relative flex w-full cursor-default items-center gap-1.5 rounded-md px-1.5 py-1 text-sm text-left outline-hidden select-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-inset:pl-7 data-[variant=destructive]:text-destructive data-[variant=destructive]:hover:bg-destructive/10 data-[variant=destructive]:hover:text-destructive data-[variant=destructive]:focus:bg-destructive/10 data-[variant=destructive]:focus:text-destructive dark:data-[variant=destructive]:hover:bg-destructive/20 dark:data-[variant=destructive]:focus:bg-destructive/20 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      onClick={(e) => {
        onOpenChange(false);
        onClick?.(e);
      }}
      {...props}
    />
  );
}

function DropdownMenuSub({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: React.ComponentProps<"button"> & { inset?: boolean }) {
  return (
    <button
      type="button"
      data-slot="dropdown-menu-sub-trigger"
      data-inset={inset}
      className={cn(
        "flex w-full cursor-default items-center gap-1.5 rounded-md px-1.5 py-1 text-sm text-left outline-hidden select-none hover:bg-accent hover:text-accent-foreground data-inset:pl-7 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      {children}
      <ChevronRightIcon className="ml-auto" />
    </button>
  );
}

function DropdownMenuSubContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dropdown-menu-sub-content"
      className={cn(
        "z-50 min-w-24 overflow-hidden rounded-lg bg-popover p-1 text-popover-foreground shadow-lg ring-1 ring-foreground/10",
        className,
      )}
      {...props}
    />
  );
}

function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  inset,
  onClick,
  ...props
}: React.ComponentProps<"button"> & {
  checked?: boolean;
  inset?: boolean;
}) {
  const { onOpenChange } = React.useContext(DropdownContext);
  return (
    <button
      type="button"
      data-slot="dropdown-menu-checkbox-item"
      data-inset={inset}
      className={cn(
        "relative flex w-full cursor-default items-center gap-1.5 rounded-md py-1 pr-8 pl-1.5 text-sm text-left outline-hidden select-none hover:bg-accent hover:text-accent-foreground data-inset:pl-7 disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      onClick={(e) => {
        onOpenChange(false);
        onClick?.(e);
      }}
      {...props}
    >
      <span className="pointer-events-none absolute right-2 flex items-center justify-center">
        {checked && <CheckIcon className="size-4" />}
      </span>
      {children}
    </button>
  );
}

function DropdownMenuRadioGroup({ ...props }: React.ComponentProps<"div">) {
  return <div data-slot="dropdown-menu-radio-group" {...props} />;
}

function DropdownMenuRadioItem({
  className,
  children,
  inset,
  onClick,
  ...props
}: React.ComponentProps<"button"> & { inset?: boolean }) {
  const { onOpenChange } = React.useContext(DropdownContext);
  return (
    <button
      type="button"
      data-slot="dropdown-menu-radio-item"
      data-inset={inset}
      className={cn(
        "relative flex w-full cursor-default items-center gap-1.5 rounded-md py-1 pr-8 pl-1.5 text-sm text-left outline-hidden select-none hover:bg-accent hover:text-accent-foreground data-inset:pl-7 disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      onClick={(e) => {
        onOpenChange(false);
        onClick?.(e);
      }}
      {...props}
    >
      <span className="pointer-events-none absolute right-2 flex items-center justify-center">
        <CheckIcon className="size-4" />
      </span>
      {children}
    </button>
  );
}

function DropdownMenuSeparator({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dropdown-menu-separator"
      className={cn("-mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  );
}

function DropdownMenuShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="dropdown-menu-shortcut"
      className={cn(
        "ml-auto text-xs tracking-widest text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

export {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
};
