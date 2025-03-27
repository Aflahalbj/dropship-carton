
import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DollarSign, ArrowUp, ArrowDown, Clock } from 'lucide-react';
import { toast } from "sonner";

const Capital = () => {
  const { 
    capital, 
    setCapital, 
    addToCapital, 
    subtractFromCapital,
    transactions,
    expenses
  } = useAppContext();
  
  const [amount, setAmount] = useState<string>('');
  const [isInitialSetup, setIsInitialSetup] = useState(capital === 0);
  
  const handleSetInitialCapital = () => {
    const parsedAmount = parseFloat(amount);
    
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    
    setCapital(parsedAmount);
    setAmount('');
    setIsInitialSetup(false);
    toast.success(`Initial capital set to $${parsedAmount.toFixed(2)}`);
  };
  
  const handleAddCapital = () => {
    const parsedAmount = parseFloat(amount);
    
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    
    addToCapital(parsedAmount);
    setAmount('');
  };
  
  const handleSubtractCapital = () => {
    const parsedAmount = parseFloat(amount);
    
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    
    if (parsedAmount > capital) {
      toast.error("Amount exceeds available capital");
      return;
    }
    
    subtractFromCapital(parsedAmount);
    setAmount('');
  };
  
  // Get capital history from transactions and expenses, sorted by date
  const getCapitalHistory = () => {
    // Convert sales to capital entries
    const salesEntries = transactions
      .filter(t => t.type === 'sale')
      .map(t => ({
        date: t.date,
        amount: t.total,
        type: 'sale',
        description: `Sale: ${t.products.length} products`
      }));
    
    // Convert purchases to capital entries
    const purchaseEntries = transactions
      .filter(t => t.type === 'purchase')
      .map(t => ({
        date: t.date,
        amount: -t.total,
        type: 'purchase',
        description: `Purchase: ${t.products.length} products`
      }));
    
    // Convert expenses to capital entries
    const expenseEntries = expenses.map(e => ({
      date: e.date,
      amount: -e.amount,
      type: 'expense',
      description: `Expense: ${e.category} - ${e.description}`
    }));
    
    // Combine and sort by date (newest first)
    return [...salesEntries, ...purchaseEntries, ...expenseEntries]
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 10); // Limit to last 10 entries
  };
  
  const capitalHistory = getCapitalHistory();
  
  return (
    <div className="animate-slide-up">
      <h2 className="text-3xl font-bold tracking-tight mb-6">Capital Management</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6 col-span-1 md:col-span-2 relative overflow-hidden">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium mb-1">Available Capital</h3>
              <p className="text-3xl font-bold">${capital.toFixed(2)}</p>
            </div>
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <DollarSign size={32} className="text-primary" />
            </div>
          </div>
          
          {/* Decorative background element */}
          <div className="absolute -right-10 -bottom-10 w-40 h-40 rounded-full bg-primary/5"></div>
        </Card>
        
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">
            {isInitialSetup ? 'Set Initial Capital' : 'Adjust Capital'}
          </h3>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-muted-foreground mb-1">
                Amount
              </label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            
            {isInitialSetup ? (
              <Button 
                className="w-full bg-primary text-white"
                onClick={handleSetInitialCapital}
              >
                Set Initial Capital
              </Button>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  className="bg-primary/90 text-white flex items-center gap-2"
                  onClick={handleAddCapital}
                >
                  <ArrowUp size={16} />
                  Add
                </Button>
                <Button 
                  variant="outline"
                  className="border-primary text-primary flex items-center gap-2"
                  onClick={handleSubtractCapital}
                >
                  <ArrowDown size={16} />
                  Subtract
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>
      
      <div className="bg-card border rounded-lg overflow-hidden">
        <div className="p-4 bg-accent border-b">
          <h3 className="font-medium">Recent Capital Changes</h3>
        </div>
        
        {capitalHistory.length > 0 ? (
          <div className="divide-y">
            {capitalHistory.map((entry, index) => (
              <div key={index} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    entry.amount > 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                  }`}>
                    {entry.amount > 0 ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                  </div>
                  <div>
                    <p className="font-medium">{entry.description}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock size={14} />
                      {entry.date.toLocaleDateString()} at {entry.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <p className={`font-medium ${entry.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {entry.amount > 0 ? '+' : ''}{entry.amount.toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center">
            <p className="text-muted-foreground">No capital changes recorded yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Capital;
