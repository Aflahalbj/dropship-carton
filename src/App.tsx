
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import { MainLayout } from "./components/layout/MainLayout";
import POS from "./pages/POS";
import Capital from "./pages/Capital";
import Inventory from "./pages/Inventory";
import NotFound from "./pages/NotFound";

// Placeholder pages (to be implemented)
const Purchases = () => <div className="animate-slide-up"><h2 className="text-3xl font-bold tracking-tight mb-6">Purchases</h2><p>Coming soon: Purchase management for restocking inventory</p></div>;
const Expenses = () => <div className="animate-slide-up"><h2 className="text-3xl font-bold tracking-tight mb-6">Expenses</h2><p>Coming soon: Expense tracking and categorization</p></div>;
const Sales = () => <div className="animate-slide-up"><h2 className="text-3xl font-bold tracking-tight mb-6">Sales</h2><p>Coming soon: Detailed sales history and transaction management</p></div>;
const Reports = () => <div className="animate-slide-up"><h2 className="text-3xl font-bold tracking-tight mb-6">Reports</h2><p>Coming soon: Revenue reports and business analytics</p></div>;
const Settings = () => <div className="animate-slide-up"><h2 className="text-3xl font-bold tracking-tight mb-6">Settings</h2><p>Coming soon: Application settings and preferences</p></div>;

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route element={<MainLayout />}>
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
        </BrowserRouter>
      </TooltipProvider>
    </AppProvider>
  </QueryClientProvider>
);

export default App;
