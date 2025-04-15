import React from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { useState, useEffect } from "react";
import { toast } from "sonner";
export const MainLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  return <div className="h-screen flex overflow-hidden bg-background">
      <Sidebar isOpen={isSidebarOpen} isMobile={isMobile} toggle={toggleSidebar} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-card shadow-subtle border-b z-10">
          <div className="h-16 flex items-center px-4">
            {isMobile && <button onClick={toggleSidebar} className="p-2 mr-4 rounded-full hover:bg-accent transition-colors" aria-label="Buka menu">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="4" x2="20" y1="12" y2="12" />
                  <line x1="4" x2="20" y1="6" y2="6" />
                  <line x1="4" x2="20" y1="18" y2="18" />
                </svg>
              </button>}
            <h1 className="text-xl font-medium tracking-tight">POS Dropship</h1>
          </div>
        </header>
        
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto animate-fade-in px-0 py-[10px]">
            <Outlet />
          </div>
        </main>
      </div>
      
      {/* Mobile sidebar overlay */}
      {isMobile && isSidebarOpen && <div className="fixed inset-0 bg-black/30 z-20" onClick={toggleSidebar} aria-hidden="true" />}
    </div>;
};