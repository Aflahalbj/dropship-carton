
import React from "react";
import { NavLink } from "react-router-dom";
import { 
  Home, 
  DollarSign, 
  Package, 
  ShoppingCart, 
  FileText, 
  BarChart, 
  Settings, 
  TrendingUp 
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  isMobile: boolean;
  toggle: () => void;
}

export const Sidebar = ({ isOpen, isMobile, toggle }: SidebarProps) => {
  const navItems = [
    { name: "Kasir", icon: <Home size={20} />, path: "/" },
    { name: "Modal", icon: <DollarSign size={20} />, path: "/capital" },
    { name: "Inventaris", icon: <Package size={20} />, path: "/inventory" },
    { name: "Pembelian", icon: <ShoppingCart size={20} />, path: "/purchases" },
    { name: "Pengeluaran", icon: <FileText size={20} />, path: "/expenses" },
    { name: "Penjualan", icon: <TrendingUp size={20} />, path: "/sales" },
    { name: "Laporan", icon: <BarChart size={20} />, path: "/reports" },
    { name: "Pengaturan", icon: <Settings size={20} />, path: "/settings" },
  ];

  const sidebarClasses = `
    h-full bg-card border-r flex flex-col w-64 transform transition-transform duration-400 ease-in-out z-30
    ${isMobile ? (isOpen ? 'translate-x-0' : '-translate-x-full fixed') : 'relative'}
  `;

  return (
    <aside className={sidebarClasses}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-bold text-primary">Dropship POS</h2>
          {isMobile && (
            <button
              onClick={toggle}
              className="p-2 rounded-full hover:bg-accent transition-colors"
              aria-label="Tutup menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          )}
        </div>
        
        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={isMobile ? toggle : undefined}
              className={({ isActive }) => `
                flex items-center px-4 py-3 text-sm rounded-lg transition-colors
                ${isActive 
                  ? 'bg-primary text-primary-foreground font-medium' 
                  : 'text-foreground hover:bg-accent'}
              `}
            >
              <span className="mr-3">{item.icon}</span>
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>
      
      <div className="mt-auto p-4 border-t">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <span className="font-medium">DS</span>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium">Toko Dropship</p>
            <p className="text-xs text-muted-foreground">Admin</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
