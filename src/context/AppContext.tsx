import React, { createContext, useContext } from 'react';
import { AppContextType, Supplier } from './types';
import { useAuthState } from './hooks/useAuthState';
import { useCapitalState } from './hooks/useCapitalState';
import { useProductState } from './hooks/useProductState';
import { useCartState } from './hooks/useCartState';
import { useTransactionState } from './hooks/useTransactionState';
import { useExpenseState } from './hooks/useExpenseState';

// Create the context
const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider component
export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  // Auth state
  const { isAuthenticated, currentUser, login, register, logout } = useAuthState();
  
  // Capital state
  const { capital, setCapital, addToCapital, subtractFromCapital } = useCapitalState(isAuthenticated, currentUser);
  
  // Product state
  const { products, setProducts, addProduct, updateProduct, deleteProduct } = useProductState(isAuthenticated, currentUser);
  
  // Cart state
  const { 
    cart, posCart, purchasesCart,
    addToPosCart, removeFromPosCart, updatePosCartItemQuantity, clearPosCart, posCartTotal, posCartProfit,
    addToPurchasesCart, removeFromPurchasesCart, updatePurchasesCartItemQuantity, clearPurchasesCart, purchasesCartTotal,
    addToCart, removeFromCart, updateCartItemQuantity, clearCart, cartTotal, cartProfit,
    handlePageNavigation
  } = useCartState();
  
  // Transaction state
  const { transactions, addTransaction, deleteTransaction } = useTransactionState(
    isAuthenticated, 
    currentUser, 
    products, 
    setProducts, 
    addToCapital, 
    subtractFromCapital, 
    clearPosCart, 
    clearPurchasesCart
  );
  
  // Expense state
  const { expenses, addExpense } = useExpenseState(isAuthenticated, currentUser, subtractFromCapital);
  
  // Other static states
  const [suppliers] = React.useState<Supplier[]>([
    {
      id: '1',
      name: 'Supplier Default',
      phone: '08123456789',
      address: 'Jl. Supplier No. 123'
    }
  ]);
  
  const currentCapital = capital;
  
  const value: AppContextType = {
    isAuthenticated,
    currentUser,
    login,
    register,
    logout,
    
    capital,
    products,
    cart,
    posCart,
    purchasesCart,
    transactions,
    expenses,
    suppliers,
    currentCapital,
    
    setCapital,
    addToCapital,
    subtractFromCapital,
    
    addProduct,
    updateProduct,
    deleteProduct,
    
    addToCart,
    removeFromCart,
    updateCartItemQuantity,
    clearCart,
    cartTotal,
    cartProfit,
    
    addToPosCart,
    removeFromPosCart,
    updatePosCartItemQuantity,
    clearPosCart,
    posCartTotal,
    posCartProfit,
    
    addToPurchasesCart,
    removeFromPurchasesCart,
    updatePurchasesCartItemQuantity,
    clearPurchasesCart,
    purchasesCartTotal,
    
    handlePageNavigation,
    
    addTransaction,
    deleteTransaction,
    
    addExpense,
  };
  
  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  
  return context;
};
