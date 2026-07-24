"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type SidebarContextType = {
  isOpen: boolean;
  toggleSidebar: () => void;
  setIsOpen: (isOpen: boolean) => void;
};

const SidebarContext = createContext<SidebarContextType | null>(null);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(true);

  const toggleSidebar = () => setIsOpen((prev) => !prev);

  return (
    <SidebarContext.Provider value={{ isOpen, toggleSidebar, setIsOpen }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}
