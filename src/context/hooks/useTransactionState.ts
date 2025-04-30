
import { useState, useEffect } from 'react';
import { Transaction, Product } from '../types';
import { getFromLocalStorage, saveToLocalStorage } from '../utils';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const useTransactionState = (
  isAuthenticated: boolean, 
  currentUser: any,
  products: Product[],
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>,
  addToCapital: (amount: number) => Promise<void>,
  subtractFromCapital: (amount: number) => Promise<boolean>,
  clearPosCart: () => void,
  clearPurchasesCart: () => void
) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Initialize state from localStorage after component mounts
  useEffect(() => {
    setTransactions(getFromLocalStorage("transactions", []));
  }, []);

  // Persist state changes to localStorage
  useEffect(() => {
    saveToLocalStorage("transactions", transactions);
  }, [transactions]);

  const addTransaction = async (transaction: Omit<Transaction, 'id'>): Promise<boolean> => {
    if (isAuthenticated) {
      try {
        const { data: transactionData, error: transactionError } = await supabase
          .from('transactions')
          .insert({
            user_id: currentUser?.id,
            date: transaction.date.toISOString(),
            total: transaction.total,
            profit: transaction.profit,
            type: transaction.type
          })
          .select();
        
        if (transactionError) {
          console.error("Error adding transaction:", transactionError);
          toast.error(`Gagal menambahkan transaksi: ${transactionError.message}`, {
            duration: 1000
          });
          return false;
        }
        
        if (transactionData && transactionData[0]) {
          const transactionId = transactionData[0].id;
          
          const transactionItems = transaction.products.map(item => ({
            transaction_id: transactionId,
            product_id: item.product.id,
            quantity: item.quantity,
            price: transaction.type === 'sale' ? item.product.price : item.product.supplierPrice
          }));
          
          const { error: itemsError } = await supabase
            .from('transaction_items')
            .insert(transactionItems);
          
          if (itemsError) {
            console.error("Error adding transaction items:", itemsError);
            toast.error(`Gagal menambahkan item transaksi: ${itemsError.message}`, {
              duration: 1000
            });
            return false;
          }
          
          for (const item of transaction.products) {
            const product = products.find(p => p.id === item.product.id);
            if (product) {
              const newStock = transaction.type === 'sale' 
                ? product.stock - item.quantity 
                : product.stock + item.quantity;
              
              const { error: stockError } = await supabase
                .from('products')
                .update({ stock: newStock })
                .eq('id', product.id);
              
              if (stockError) {
                console.error("Error updating product stock:", stockError);
                toast.error(`Gagal memperbarui stok produk: ${stockError.message}`, {
                  duration: 1000
                });
                continue;
              }
            }
          }
        }
      } catch (error) {
        console.error("Error in addTransaction:", error);
        toast.error("An error occurred while adding transaction");
        return false;
      }
    }
    
    const newTransaction = {
      ...transaction,
      id: Date.now().toString(),
    };
    
    const updatedProducts = [...products];
    
    if (transaction.type === 'sale') {
      const hasInsufficientStock = transaction.products.some(
        item => {
          const product = products.find(p => p.id === item.product.id);
          return product ? item.quantity > product.stock : false;
        }
      );
      
      if (hasInsufficientStock) {
        toast.error("Stok tidak mencukupi untuk beberapa barang", {
          duration: 1000
        });
        return false;
      }
      
      transaction.products.forEach(item => {
        const productIndex = updatedProducts.findIndex(
          p => p.id === item.product.id
        );
        
        if (productIndex !== -1) {
          updatedProducts[productIndex] = {
            ...updatedProducts[productIndex],
            stock: updatedProducts[productIndex].stock - item.quantity
          };
        }
      });
      
      await addToCapital(transaction.total);
      clearPosCart();
    } else if (transaction.type === 'purchase') {
      const success = await subtractFromCapital(transaction.total);
      if (!success) {
        return false;
      }
      
      transaction.products.forEach(item => {
        const productIndex = updatedProducts.findIndex(
          p => p.id === item.product.id
        );
        
        if (productIndex !== -1) {
          updatedProducts[productIndex] = {
            ...updatedProducts[productIndex],
            stock: updatedProducts[productIndex].stock + item.quantity
          };
        }
      });
      
      clearPurchasesCart();
    }
    
    setProducts(updatedProducts);
    setTransactions(prev => [...prev, newTransaction]);
    
    return true;
  };
  
  const deleteTransaction = (id: string | undefined, restoreStock: boolean = true): boolean => {
    if (!id) {
      toast.error("ID transaksi tidak valid");
      return false;
    }

    try {
      // Find the transaction
      const transaction = transactions.find(t => t.id === id);
      if (!transaction) {
        toast.error("Transaksi tidak ditemukan");
        return false;
      }

      // Update product stock based on transaction type and restoreStock flag
      const updatedProducts = [...products];
      
      if (transaction.type === 'sale' && restoreStock) {
        // For a sale transaction, add the products back to stock if restoreStock is true
        transaction.products.forEach(item => {
          const productIndex = updatedProducts.findIndex(p => p.id === item.product.id);
          if (productIndex !== -1) {
            updatedProducts[productIndex] = {
              ...updatedProducts[productIndex],
              stock: updatedProducts[productIndex].stock + item.quantity
            };
          }
        });
        
        // Return the money from capital
        subtractFromCapital(transaction.total);
      } else if (transaction.type === 'purchase' && restoreStock) {
        // For a purchase transaction, remove the products from stock if restoreStock is true
        transaction.products.forEach(item => {
          const productIndex = updatedProducts.findIndex(p => p.id === item.product.id);
          if (productIndex !== -1) {
            // Don't allow stock to go below 0
            const newStock = Math.max(0, updatedProducts[productIndex].stock - item.quantity);
            updatedProducts[productIndex] = {
              ...updatedProducts[productIndex],
              stock: newStock
            };
          }
        });
        
        // Add the money back to capital
        addToCapital(transaction.total);
      }

      if (restoreStock) {
        // Update products with new stock values only if restoreStock is true
        setProducts(updatedProducts);
      }
      
      // Remove the transaction from the list
      setTransactions(prev => prev.filter(t => t.id !== id));
      
      // TODO: If using Supabase, we would delete the transaction from the database here
      // For now, just return success
      return true;
    } catch (error) {
      console.error("Error deleting transaction:", error);
      toast.error("Gagal menghapus transaksi");
      return false;
    }
  };

  return {
    transactions,
    setTransactions,
    addTransaction,
    deleteTransaction
  };
};
