
import React, { useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AppProvider, useAppContext } from "./context/AppContext";
import { MainLayout } from "./components/layout/MainLayout";
import POS from "./pages/POS";
import Capital from "./pages/Capital";
import Inventory from "./pages/Inventory";
import Purchases from "./pages/Purchases";
import Expenses from "./pages/Expenses";
import Reports from "./pages/Reports";
import NotFound from "./pages/NotFound";
import Sales from "./pages/Sales";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import { ensureAnonymousUser } from "./integrations/supabase/client";

// Create a client
const queryClient = new QueryClient();

// Protected Route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAppContext();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

// Separate the routes component to avoid React hook issues
const AppRoutes = () => {
  // Initialize anonymous authentication on app start
  useEffect(() => {
    const initAuth = async () => {
      try {
        await ensureAnonymousUser();
      } catch (error) {
        console.error("Failed to initialize anonymous authentication:", error);
      }
    };
    
    initAuth();
  }, []);
  
  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route element={
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
      }>
        <Route path="/" element={<POS />} />
        <Route path="/capital" element={<Capital />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/purchases" element={<Purchases />} />
        <Route path="/expenses" element={<Expenses />} />
        <Route path="/sales" element={<Sales />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppProvider>
      <TooltipProvider>
        <BrowserRouter>
          <Toaster 
            duration={1000}
            position="top-center"
          />
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AppProvider>
  </QueryClientProvider>
);

export default App;
