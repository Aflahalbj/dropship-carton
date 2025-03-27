
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from "sonner";

// Define types
export interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  supplierPrice: number;
  stock: number;
  image?: string;
}

export interface Transaction {
  id: string;
  date: Date;
  products: { product: Product; quantity: number }[];
  total: number;
  profit: number;
  type: 'sale' | 'purchase';
}

export interface Expense {
  id: string;
  date: Date;
  category: string;
  amount: number;
  description: string;
}

interface AppContextType {
  // Capital
  capital: number;
  setCapital: (amount: number) => void;
  addToCapital: (amount: number) => void;
  subtractFromCapital: (amount: number) => void;
  
  // Products
  products: Product[];
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  
  // Transactions
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  
  // Expenses
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  
  // Cart functionality for POS
  cart: { product: Product; quantity: number }[];
  addToCart: (product: Product, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartItemQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: () => number;
  cartProfit: () => number;
  
  // Analytics
  getTotalSales: () => number;
  getTotalPurchases: () => number;
  getTotalExpenses: () => number;
  getTotalProfit: () => number;
}

// Create context
const AppContext = createContext<AppContextType | undefined>(undefined);

// Sample data
const initialProducts: Product[] = [
  {
    id: '1',
    name: 'Wireless Earbuds',
    sku: 'WE-001',
    price: 59.99,
    supplierPrice: 29.99,
    stock: 25,
  },
  {
    id: '2',
    name: 'Smart Watch',
    sku: 'SW-002',
    price: 129.99,
    supplierPrice: 79.99,
    stock: 15,
  },
  {
    id: '3',
    name: 'Portable Charger',
    sku: 'PC-003',
    price: 39.99,
    supplierPrice: 19.99,
    stock: 30,
  },
  {
    id: '4',
    name: 'Bluetooth Speaker',
    sku: 'BS-004',
    price: 49.99,
    supplierPrice: 24.99,
    stock: 20,
  },
  {
    id: '5',
    name: 'Smartphone Case',
    sku: 'SC-005',
    price: 19.99,
    supplierPrice: 5.99,
    stock: 50,
  },
];

// Context Provider
export const AppProvider = ({ children }: { children: ReactNode }) => {
  // Initialize states
  const [capital, setCapital] = useState<number>(10000);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  
  // Load persisted data on component mount
  useEffect(() => {
    try {
      const storedCapital = localStorage.getItem('capital');
      const storedProducts = localStorage.getItem('products');
      const storedTransactions = localStorage.getItem('transactions');
      const storedExpenses = localStorage.getItem('expenses');
      
      if (storedCapital) setCapital(JSON.parse(storedCapital));
      if (storedProducts) setProducts(JSON.parse(storedProducts));
      if (storedTransactions) {
        const parsedTransactions = JSON.parse(storedTransactions);
        // Convert date strings back to Date objects
        setTransactions(parsedTransactions.map((t: any) => ({
          ...t,
          date: new Date(t.date)
        })));
      }
      if (storedExpenses) {
        const parsedExpenses = JSON.parse(storedExpenses);
        setExpenses(parsedExpenses.map((e: any) => ({
          ...e,
          date: new Date(e.date)
        })));
      }
    } catch (error) {
      console.error('Error loading data from localStorage:', error);
    }
  }, []);
  
  // Save data to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('capital', JSON.stringify(capital));
    localStorage.setItem('products', JSON.stringify(products));
    localStorage.setItem('transactions', JSON.stringify(transactions));
    localStorage.setItem('expenses', JSON.stringify(expenses));
  }, [capital, products, transactions, expenses]);
  
  // Capital functions
  const addToCapital = (amount: number) => {
    setCapital(prev => prev + amount);
    toast.success(`Added $${amount.toFixed(2)} to capital`);
  };
  
  const subtractFromCapital = (amount: number) => {
    if (amount > capital) {
      toast.error("Insufficient capital");
      return false;
    }
    setCapital(prev => prev - amount);
    toast.success(`Subtracted $${amount.toFixed(2)} from capital`);
    return true;
  };
  
  // Product functions
  const addProduct = (product: Omit<Product, 'id'>) => {
    const newProduct = {
      ...product,
      id: Date.now().toString(),
    };
    setProducts(prev => [...prev, newProduct]);
    toast.success(`Added product: ${product.name}`);
  };
  
  const updateProduct = (product: Product) => {
    setProducts(prev => 
      prev.map(p => p.id === product.id ? product : p)
    );
    toast.success(`Updated product: ${product.name}`);
  };
  
  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    toast.success("Product deleted");
  };
  
  // Transaction functions
  const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
    const newTransaction = {
      ...transaction,
      id: Date.now().toString(),
    };
    
    setTransactions(prev => [...prev, newTransaction]);
    
    // Update capital based on transaction type
    if (transaction.type === 'sale') {
      addToCapital(transaction.total);
      
      // Update product stock
      transaction.products.forEach(({ product, quantity }) => {
        const updatedProduct = {
          ...product,
          stock: product.stock - quantity
        };
        updateProduct(updatedProduct);
      });
    } else if (transaction.type === 'purchase') {
      if (!subtractFromCapital(transaction.total)) {
        return false;
      }
      
      // Update product stock
      transaction.products.forEach(({ product, quantity }) => {
        const updatedProduct = {
          ...product,
          stock: product.stock + quantity
        };
        updateProduct(updatedProduct);
      });
    }
    
    return true;
  };
  
  // Expense functions
  const addExpense = (expense: Omit<Expense, 'id'>) => {
    if (!subtractFromCapital(expense.amount)) {
      return false;
    }
    
    const newExpense = {
      ...expense,
      id: Date.now().toString(),
    };
    
    setExpenses(prev => [...prev, newExpense]);
    toast.success(`Expense recorded: $${expense.amount.toFixed(2)}`);
    return true;
  };
  
  // Cart functions
  const addToCart = (product: Product, quantity: number) => {
    // Check if product is already in cart
    const existingIndex = cart.findIndex(item => item.product.id === product.id);
    
    if (existingIndex >= 0) {
      // Update quantity of existing item
      const updatedCart = [...cart];
      updatedCart[existingIndex].quantity += quantity;
      setCart(updatedCart);
    } else {
      // Add new item to cart
      setCart(prev => [...prev, { product, quantity }]);
    }
    
    toast.success(`Added ${quantity} ${product.name} to cart`);
  };
  
  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };
  
  const updateCartItemQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCart(prev => 
      prev.map(item => 
        item.product.id === productId 
          ? { ...item, quantity } 
          : item
      )
    );
  };
  
  const clearCart = () => {
    setCart([]);
  };
  
  const cartTotal = () => {
    return cart.reduce((total, item) => 
      total + (item.product.price * item.quantity), 0
    );
  };
  
  const cartProfit = () => {
    return cart.reduce((profit, item) => 
      profit + ((item.product.price - item.product.supplierPrice) * item.quantity), 0
    );
  };
  
  // Analytics functions
  const getTotalSales = () => {
    return transactions
      .filter(t => t.type === 'sale')
      .reduce((total, t) => total + t.total, 0);
  };
  
  const getTotalPurchases = () => {
    return transactions
      .filter(t => t.type === 'purchase')
      .reduce((total, t) => total + t.total, 0);
  };
  
  const getTotalExpenses = () => {
    return expenses.reduce((total, e) => total + e.amount, 0);
  };
  
  const getTotalProfit = () => {
    const salesProfit = transactions
      .filter(t => t.type === 'sale')
      .reduce((total, t) => total + t.profit, 0);
    
    const totalExpenses = getTotalExpenses();
    
    return salesProfit - totalExpenses;
  };
  
  const contextValue = {
    capital,
    setCapital,
    addToCapital,
    subtractFromCapital,
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    transactions,
    addTransaction,
    expenses,
    addExpense,
    cart,
    addToCart,
    removeFromCart,
    updateCartItemQuantity,
    clearCart,
    cartTotal,
    cartProfit,
    getTotalSales,
    getTotalPurchases,
    getTotalExpenses,
    getTotalProfit,
  };
  
  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use the context
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
