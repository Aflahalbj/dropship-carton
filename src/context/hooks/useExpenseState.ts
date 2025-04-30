
import { useState, useEffect } from 'react';
import { Expense } from '../types';
import { getFromLocalStorage, saveToLocalStorage } from '../utils';
import { toast } from "sonner";
import { supabase, ensureAnonymousUser } from "@/integrations/supabase/client";

export const useExpenseState = (
  isAuthenticated: boolean, 
  currentUser: any,
  subtractFromCapital: (amount: number) => Promise<boolean>
) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // Initialize state from localStorage after component mounts
  useEffect(() => {
    setExpenses(getFromLocalStorage("expenses", []));
  }, []);

  // Persist state changes to localStorage
  useEffect(() => {
    saveToLocalStorage("expenses", expenses);
  }, [expenses]);

  const addExpense = async (expense: Omit<Expense, 'id'>): Promise<boolean> => {
    try {
      const success = await subtractFromCapital(expense.amount);
      if (!success) {
        return false;
      }
      
      const newExpense: Expense = {
        ...expense,
        id: Date.now().toString(),
      };
      
      if (isAuthenticated && currentUser) {
        try {
          // Ensure we have a session
          await ensureAnonymousUser().catch(err => {
            console.error("Anonymous auth failed:", err.message);
          });
          
          const { data, error } = await supabase
            .from('expenses')
            .insert({
              user_id: currentUser.id,
              date: expense.date.toISOString(),
              amount: expense.amount,
              category: expense.category,
              description: expense.description
            })
            .select();
          
          if (error) {
            console.error("Error adding expense:", error);
            toast.error(`Gagal menambahkan pengeluaran: ${error.message}`, {
              duration: 1000
            });
            return false;
          }
          
          if (data && data[0]) {
            const dbExpense = {
              id: data[0].id,
              date: new Date(data[0].date),
              amount: data[0].amount,
              category: data[0].category,
              description: data[0].description
            };
            
            setExpenses(prev => [...prev, dbExpense]);
            toast.success(`Pengeluaran dicatat: Rp${expense.amount.toLocaleString('id-ID')}`, {
              duration: 1000
            });
            return true;
          }
        } catch (error) {
          console.error("Error in Supabase expense creation:", error);
          toast.error("Error creating expense in database");
          return false;
        }
      } else {
        setExpenses(prev => [...prev, newExpense]);
        toast.success(`Pengeluaran dicatat: Rp${expense.amount.toLocaleString('id-ID')}`, {
          duration: 1000
        });
        return true;
      }
      
      return false;
    } catch (err: any) {
      console.error("Exception in addExpense:", err);
      toast.error(`Terjadi kesalahan: ${err.message || 'Tidak diketahui'}`);
      return false;
    }
  };

  return {
    expenses,
    setExpenses,
    addExpense
  };
};
