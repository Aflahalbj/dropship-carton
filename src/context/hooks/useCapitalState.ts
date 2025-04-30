
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { getFromLocalStorage, saveToLocalStorage } from '../utils';
import { toast } from "sonner";

export const useCapitalState = (isAuthenticated: boolean, currentUser: any) => {
  const [capital, setCapital] = useState<number>(0);

  // Initialize state from localStorage after component mounts
  useEffect(() => {
    setCapital(getFromLocalStorage("capital", 0));
  }, []);

  // Persist state changes to localStorage
  useEffect(() => {
    saveToLocalStorage("capital", capital);
  }, [capital]);

  // Load initial data from Supabase when authenticated
  useEffect(() => {
    const loadCapitalData = async () => {
      if (isAuthenticated && currentUser) {
        try {
          const { data: capitalData, error: capitalError } = await supabase
            .from('capital')
            .select('*')
            .limit(1)
            .maybeSingle();
          
          if (capitalError) {
            console.error("Error loading capital:", capitalError);
          } else if (capitalData) {
            setCapital(capitalData.amount);
          }
        } catch (error) {
          console.error("Error in loadCapitalData:", error);
        }
      }
    };
    
    loadCapitalData();
  }, [isAuthenticated, currentUser]);

  const addToCapital = async (amount: number): Promise<void> => {
    const newAmount = capital + amount;
    
    if (isAuthenticated) {
      try {
        const { data: capitalData, error: capitalCheckError } = await supabase
          .from('capital')
          .select('id')
          .limit(1)
          .maybeSingle();
        
        if (capitalCheckError) {
          console.error("Error checking capital:", capitalCheckError);
          toast.error("Failed to check capital record");
          return;
        }
        
        let updateError;
        
        if (capitalData?.id) {
          // Update existing capital record
          const { error } = await supabase
            .from('capital')
            .update({ amount: newAmount })
            .eq('id', capitalData.id);
            
          updateError = error;
        } else {
          // Create new capital record
          const { error } = await supabase
            .from('capital')
            .insert({ amount: newAmount });
            
          updateError = error;
        }
        
        if (updateError) {
          console.error("Error updating capital:", updateError);
          toast.error("Failed to update capital");
          return;
        }
      } catch (error) {
        console.error("Error in addToCapital:", error);
        toast.error("An error occurred while updating capital");
        return;
      }
    }
    
    setCapital(newAmount);
    toast.success(`Rp${amount.toLocaleString('id-ID')} ditambahkan ke modal`, {
      duration: 1000
    });
  };
  
  const subtractFromCapital = async (amount: number): Promise<boolean> => {
    if (amount > capital) {
      toast.error("Modal tidak mencukupi", {
        duration: 1000
      });
      return false;
    }
    
    const newAmount = capital - amount;
    
    if (isAuthenticated) {
      try {
        const { data: capitalData, error: capitalCheckError } = await supabase
          .from('capital')
          .select('id')
          .limit(1)
          .maybeSingle();
        
        if (capitalCheckError) {
          console.error("Error checking capital:", capitalCheckError);
          toast.error("Failed to check capital record");
          return false;
        }
        
        let updateError;
        
        if (capitalData?.id) {
          // Update existing capital record
          const { error } = await supabase
            .from('capital')
            .update({ amount: newAmount })
            .eq('id', capitalData.id);
            
          updateError = error;
        } else {
          // Create new capital record
          const { error } = await supabase
            .from('capital')
            .insert({ amount: newAmount });
            
          updateError = error;
        }
        
        if (updateError) {
          console.error("Error updating capital:", updateError);
          toast.error("Failed to update capital");
          return false;
        }
      } catch (error) {
        console.error("Error in subtractFromCapital:", error);
        toast.error("An error occurred while updating capital");
        return false;
      }
    }
    
    setCapital(newAmount);
    return true;
  };

  return {
    capital,
    setCapital,
    addToCapital,
    subtractFromCapital,
  };
};
