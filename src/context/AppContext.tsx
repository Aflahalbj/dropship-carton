import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from "sonner";

// Define types
export type Product = {
  id: string;
  name: string;
  sku: string;
  price: number;
  supplierPrice: number;
  stock: number;
  image?: string;
};

export type CartItem = {
  product: Product;
  quantity: number;
};

export type Transaction = {
  id?: string;
  date: Date;
  products: CartItem[];
  total: number;
  profit: number;
  type: 'sale' | 'purchase';
};

export type Expense = {
  id: string;
  date: Date;
  amount: number;
  category: string;
  description: string;
};

export type User = {
  id: string;
  email: string;
  name: string;
};

// Define context type
type AppContextType = {
  // Auth state
  isAuthenticated: boolean;
  currentUser: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  
  // State
  capital: number;
  products: Product[];
  cart: CartItem[];
  transactions: Transaction[];
  expenses: Expense[];
  
  // Capital functions
  setCapital: (amount: number) => void;
  addToCapital: (amount: number) => void;
  subtractFromCapital: (amount: number) => boolean;
  
  // Product functions
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  
  // Cart functions
  addToCart: (product: Product, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartItemQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: () => number;
  cartProfit: () => number;
  
  // Transaction functions
  addTransaction: (transaction: Omit<Transaction, 'id'>) => boolean;
  
  // Expense functions
  addExpense: (expense: Omit<Expense, 'id'>) => boolean;
};

// Mock users for demo purposes
const MOCK_USERS: User[] = [
  {
    id: "1",
    email: "admin@example.com",
    name: "Admin"
  }
];

// Create context
const AppContext = createContext<AppContextType | undefined>(undefined);

// Auth helper functions
const saveToLocalStorage = (key: string, value: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error("Error saving to localStorage:", error);
  }
};

const getFromLocalStorage = (key: string, defaultValue: any = null) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : defaultValue;
  } catch (error) {
    console.error("Error getting from localStorage:", error);
    return defaultValue;
  }
};

// Provider component
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!getFromLocalStorage("currentUser"));
  const [currentUser, setCurrentUser] = useState<User | null>(getFromLocalStorage("currentUser"));
  
  // App state
  const [capital, setCapital] = useState<number>(getFromLocalStorage("capital", 0));
  const [products, setProducts] = useState<Product[]>(getFromLocalStorage("products", []));
  const [cart, setCart] = useState<CartItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>(getFromLocalStorage("transactions", []));
  const [expenses, setExpenses] = useState<Expense[]>(getFromLocalStorage("expenses", []));
  const [users, setUsers] = useState<User[]>(getFromLocalStorage("users", MOCK_USERS));
  
  // Persist state changes to localStorage
  useEffect(() => {
    saveToLocalStorage("capital", capital);
    saveToLocalStorage("products", products);
    saveToLocalStorage("transactions", transactions);
    saveToLocalStorage("expenses", expenses);
    saveToLocalStorage("users", users);
  }, [capital, products, transactions, expenses, users]);
  
  // Auth functions
  const login = async (email: string, password: string): Promise<void> => {
    // In a real app, this would be an API call to validate credentials
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      throw new Error("Invalid email or password");
    }
    
    // For this demo, we're not actually validating the password
    setCurrentUser(user);
    setIsAuthenticated(true);
    saveToLocalStorage("currentUser", user);
  };
  
  const register = async (email: string, password: string, name: string): Promise<void> => {
    // Check if email already exists
    const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      throw new Error("Email already registered");
    }
    
    // Create new user
    const newUser: User = {
      id: Date.now().toString(),
      email,
      name
    };
    
    // Update users array
    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    
    // In a real app, we'd hash the password and store it securely
  };
  
  const logout = (): void => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem("currentUser");
  };
  
  // Capital functions
  const addToCapital = (amount: number): void => {
    setCapital(prev => prev + amount);
    toast.success(`Rp${amount.toLocaleString('id-ID')} ditambahkan ke modal`);
  };
  
  const subtractFromCapital = (amount: number): boolean => {
    if (amount > capital) {
      toast.error("Modal tidak mencukupi");
      return false;
    }
    
    setCapital(prev => prev - amount);
    return true;
  };
  
  // Product functions
  const addProduct = (product: Omit<Product, 'id'>): void => {
    const newProduct = {
      ...product,
      id: Date.now().toString(),
    };
    
    setProducts(prev => [...prev, newProduct]);
    toast.success(`Produk ditambahkan: ${product.name}`);
  };
  
  const updateProduct = (product: Product): void => {
    setProducts(prev => 
      prev.map(p => p.id === product.id ? product : p)
    );
    toast.success(`Produk diperbarui: ${product.name}`);
  };
  
  const deleteProduct = (id: string): void => {
    setProducts(prev => prev.filter(p => p.id !== id));
    toast.success("Produk dihapus");
  };
  
  // Cart functions
  const addToCart = (product: Product, quantity: number): void => {
    const existingItem = cart.find(item => item.product.id === product.id);
    
    if (existingItem) {
      updateCartItemQuantity(
        product.id, 
        existingItem.quantity + quantity
      );
      return;
    }
    
    setCart(prev => [...prev, { product, quantity }]);
  };
  
  const removeFromCart = (productId: string): void => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };
  
  const updateCartItemQuantity = (productId: string, quantity: number): void => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    // Check stock only for sales (not for purchases)
    const isInPOS = window.location.pathname.includes("pos") || window.location.pathname === "/";
    
    // For POS (cashier), enforce stock limits
    if (isInPOS && quantity > product.stock) {
      toast.error("Stok tidak mencukupi");
      return;
    }
    
    // For Purchases, allow any quantity regardless of current stock
    
    setCart(prev => 
      prev.map(item => 
        item.product.id === productId 
          ? { ...item, quantity } 
          : item
      )
    );
  };
  
  const clearCart = (): void => {
    setCart([]);
  };
  
  const cartTotal = (): number => {
    return cart.reduce(
      (total, item) => total + (item.product.price * item.quantity), 
      0
    );
  };
  
  const cartProfit = (): number => {
    return cart.reduce(
      (total, item) => 
        total + ((item.product.price - item.product.supplierPrice) * item.quantity), 
      0
    );
  };
  
  // Transaction functions
  const addTransaction = (transaction: Omit<Transaction, 'id'>): boolean => {
    const newTransaction = {
      ...transaction,
      id: Date.now().toString(),
    };
    
    // Update stock for products
    const updatedProducts = [...products];
    
    if (transaction.type === 'sale') {
      // Check if we have enough stock
      const hasInsufficientStock = transaction.products.some(
        item => {
          const product = products.find(p => p.id === item.product.id);
          return product ? item.quantity > product.stock : false;
        }
      );
      
      if (hasInsufficientStock) {
        toast.error("Stok tidak mencukupi untuk beberapa barang");
        return false;
      }
      
      // Reduce stock for sold products
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
      
      // Add the sale amount to capital
      addToCapital(transaction.total);
    } else if (transaction.type === 'purchase') {
      // For purchases, increase stock and deduct from capital
      
      // Check if we have enough capital
      if (!subtractFromCapital(transaction.total)) {
        return false;
      }
      
      // Increase stock for purchased products
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
    }
    
    // Update products state
    setProducts(updatedProducts);
    
    // Add the transaction to state
    setTransactions(prev => [...prev, newTransaction]);
    
    return true;
  };
  
  // Expense functions
  const addExpense = (expense: Omit<Expense, 'id'>): boolean => {
    if (!subtractFromCapital(expense.amount)) {
      return false;
    }
    
    const newExpense = {
      ...expense,
      id: Date.now().toString(),
    };
    
    setExpenses(prev => [...prev, newExpense]);
    toast.success(`Pengeluaran dicatat: Rp${expense.amount.toLocaleString('id-ID')}`);
    return true;
  };
  
  const value = {
    // Auth state and functions
    isAuthenticated,
    currentUser,
    login,
    register,
    logout,
    
    // State
    capital,
    products,
    cart,
    transactions,
    expenses,
    
    // Capital functions
    setCapital,
    addToCapital,
    subtractFromCapital,
    
    // Product functions
    addProduct,
    updateProduct,
    deleteProduct,
    
    // Cart functions
    addToCart,
    removeFromCart,
    updateCartItemQuantity,
    clearCart,
    cartTotal,
    cartProfit,
    
    // Transaction functions
    addTransaction,
    
    // Expense functions
    addExpense,
  };
  
  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use the context
export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  
  return context;
};
