import { useState, useRef, useEffect, createContext, useContext, cloneElement, isValidElement, type ReactNode } from "react";

const Ctx = createContext<{ open: boolean; setOpen: (v: boolean) => void }>({
  open: false,
  setOpen: () => {},
});

export function Popover({ children, onOpenChange }: { children: ReactNode; onOpenChange?: (open: boolean) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const handleSetOpen = (val: boolean) => {
    setOpen(val);
    onOpenChange?.(val);
  };

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        handleSetOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <Ctx.Provider value={{ open, setOpen: handleSetOpen }}>
      <div ref={ref} className="relative inline-block">
        {children}
      </div>
    </Ctx.Provider>
  );
}

export function PopoverTrigger({ children, asChild }: { children: any; asChild?: boolean }) {
  const { open, setOpen } = useContext(Ctx);
  if (asChild && isValidElement(children)) {
    return cloneElement(children as React.ReactElement<any>, {
      onClick: (e: any) => {
        children.props.onClick?.(e);
        setOpen(!open);
      },
    });
  }
  return <button onClick={() => setOpen(!open)}>{children}</button>;
}

export function PopoverContent({ children, className, align }: { children: ReactNode; className?: string; align?: string }) {
  const { open } = useContext(Ctx);
  if (!open) return null;
  return (
    <div className={`absolute right-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-xl ${className ?? ""}`}>
      {children}
    </div>
  );
}