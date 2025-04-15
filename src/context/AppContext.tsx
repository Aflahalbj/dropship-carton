import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { User as SupabaseUser, Session } from '@supabase/supabase-js';

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
  customerName?: string;
  paymentMethod?: 'cash' | 'transfer';
  cashAmount?: number;
  changeAmount?: number;
};

export type Expense = {
  id: string;
  date: Date;
  amount: number;
  category: string;
  description: string;
};

export type AppUser = {
  id: string;
  email: string;
  name: string;
};

// Define context type
type AppContextType = {
  // Auth state
  isAuthenticated: boolean;
  currentUser: AppUser | null;
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
  addToCapital: (amount: number) => Promise<void>;
  subtractFromCapital: (amount: number) => Promise<boolean>;
  
  // Product functions
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  
  // Cart functions
  addToCart: (product: Product, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartItemQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: () => number;
  cartProfit: () => number;
  handlePageNavigation: (currentPath: string) => void;
  
  // Transaction functions
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<boolean>;
  
  // Expense functions
  addExpense: (expense: Omit<Expense, 'id'>) => Promise<boolean>;
};

// Create context with a default value to avoid null checks
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
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  
  // App state
  const [capital, setCapital] = useState<number>(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  // Store previous path to compare when navigating
  const previousPathRef = useRef<string | null>(null);
  
  // Initialize state from localStorage after component mounts
  useEffect(() => {
    // Load data from localStorage
    const storedUser = getFromLocalStorage("currentUser");
    if (storedUser) {
      setCurrentUser(storedUser);
      setIsAuthenticated(true);
    }
    
    setCapital(getFromLocalStorage("capital", 0));
    setProducts(getFromLocalStorage("products", []));
    setTransactions(getFromLocalStorage("transactions", []));
    setExpenses(getFromLocalStorage("expenses", []));
  }, []);
  
  // Initialize Supabase auth
  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        if (session?.user) {
          const user: AppUser = {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata.name || ''
          };
          setCurrentUser(user);
          setIsAuthenticated(true);
          saveToLocalStorage("currentUser", user);
        } else {
          setCurrentUser(null);
          setIsAuthenticated(false);
          localStorage.removeItem("currentUser");
        }
      }
    );
    
    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        const user: AppUser = {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata.name || ''
        };
        setCurrentUser(user);
        setIsAuthenticated(true);
        saveToLocalStorage("currentUser", user);
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  // Load initial data from Supabase when authenticated
  useEffect(() => {
    const loadInitialData = async () => {
      if (isAuthenticated && currentUser) {
        // Load capital
        const { data: capitalData, error: capitalError } = await supabase
          .from('capital')
          .select('*')
          .limit(1)
          .single();
        
        if (capitalError) {
          console.error("Error loading capital:", capitalError);
        } else if (capitalData) {
          setCapital(capitalData.amount);
        }
        
        // Load products
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*');
        
        if (productsError) {
          console.error("Error loading products:", productsError);
        } else if (productsData) {
          const formattedProducts = productsData.map(p => ({
            id: p.id,
            name: p.name,
            sku: p.sku,
            price: p.price,
            supplierPrice: p.supplier_price,
            stock: p.stock,
            image: p.image
          }));
          setProducts(formattedProducts);
        }
        
        // We can add more data loading here as needed
      }
    };
    
    loadInitialData();
  }, [isAuthenticated, currentUser]);
  
  // Persist state changes to localStorage
  useEffect(() => {
    saveToLocalStorage("capital", capital);
    saveToLocalStorage("products", products);
    saveToLocalStorage("transactions", transactions);
    saveToLocalStorage("expenses", expenses);
  }, [capital, products, transactions, expenses]);
  
  // Auth functions
  const login = async (email: string, password: string): Promise<void> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      throw new Error(error.message);
    }
    
    // Auth state will be updated by the onAuthStateChange listener
  };
  
  const register = async (email: string, password: string, name: string): Promise<void> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    });
    
    if (error) {
      throw new Error(error.message);
    }
    
    // Auth state will be updated by the onAuthStateChange listener
  };
  
  const logout = async (): Promise<void> => {
    await supabase.auth.signOut();
    // Auth state will be updated by the onAuthStateChange listener
  };
  
  // Capital functions
  const addToCapital = async (amount: number): Promise<void> => {
    const newAmount = capital + amount;
    
    // Update in Supabase if authenticated
    if (isAuthenticated) {
      const { data, error } = await supabase
        .from('capital')
        .update({ amount: newAmount })
        .eq('id', (await supabase.from('capital').select('id').limit(1).single()).data?.id)
        .select();
      
      if (error) {
        console.error("Error updating capital:", error);
        toast.error("Gagal memperbarui modal");
        return;
      }
    }
    
    setCapital(newAmount);
    toast.success(`Rp${amount.toLocaleString('id-ID')} ditambahkan ke modal`);
  };
  
  const subtractFromCapital = async (amount: number): Promise<boolean> => {
    if (amount > capital) {
      toast.error("Modal tidak mencukupi");
      return false;
    }
    
    const newAmount = capital - amount;
    
    // Update in Supabase if authenticated
    if (isAuthenticated) {
      const { data, error } = await supabase
        .from('capital')
        .update({ amount: newAmount })
        .eq('id', (await supabase.from('capital').select('id').limit(1).single()).data?.id)
        .select();
      
      if (error) {
        console.error("Error updating capital:", error);
        toast.error("Gagal memperbarui modal");
        return false;
      }
    }
    
    setCapital(newAmount);
    return true;
  };
  
  // Product functions
  const addProduct = async (product: Omit<Product, 'id'>): Promise<void> => {
    // Add to Supabase if authenticated
    if (isAuthenticated) {
      const { data, error } = await supabase
        .from('products')
        .insert({
          name: product.name,
          sku: product.sku,
          price: product.price,
          supplier_price: product.supplierPrice,
          stock: product.stock,
          image: product.image
        })
        .select();
      
      if (error) {
        console.error("Error adding product:", error);
        toast.error(`Gagal menambahkan produk: ${error.message}`);
        return;
      }
      
      if (data && data[0]) {
        const newProduct = {
          id: data[0].id,
          name: data[0].name,
          sku: data[0].sku,
          price: data[0].price,
          supplierPrice: data[0].supplier_price,
          stock: data[0].stock,
          image: data[0].image
        };
        
        setProducts(prev => [...prev, newProduct]);
        toast.success(`Produk ditambahkan: ${product.name}`);
        return;
      }
    }
    
    // Fallback to local storage if not authenticated or Supabase operation failed
    const newProduct = {
      ...product,
      id: Date.now().toString(),
    };
    
    setProducts(prev => [...prev, newProduct]);
    toast.success(`Produk ditambahkan: ${product.name}`);
  };
  
  const updateProduct = async (product: Product): Promise<void> => {
    // Update in Supabase if authenticated
    if (isAuthenticated) {
      const { data, error } = await supabase
        .from('products')
        .update({
          name: product.name,
          sku: product.sku,
          price: product.price,
          supplier_price: product.supplierPrice,
          stock: product.stock,
          image: product.image
        })
        .eq('id', product.id)
        .select();
      
      if (error) {
        console.error("Error updating product:", error);
        toast.error(`Gagal memperbarui produk: ${error.message}`);
        return;
      }
    }
    
    setProducts(prev => 
      prev.map(p => p.id === product.id ? product : p)
    );
    toast.success(`Produk diperbarui: ${product.name}`);
  };
  
  const deleteProduct = async (id: string): Promise<void> => {
    try {
      // Check if the product is used in any transactions
      const { data: transactionItems, error: checkError } = await supabase
        .from('transaction_items')
        .select('id')
        .eq('product_id', id)
        .limit(1);
      
      if (checkError) {
        console.error("Error checking product usage:", checkError);
        toast.error(`Gagal memeriksa produk: ${checkError.message}`);
        return;
      }
      
      // If the product is used in transactions, show a message to the user
      if (transactionItems && transactionItems.length > 0) {
        toast.error("Produk tidak dapat dihapus karena sudah digunakan dalam transaksi");
        return;
      }
      
      // If product is not used in transactions, proceed with deletion
      if (isAuthenticated) {
        const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', id);
        
        if (error) {
          console.error("Error deleting product:", error);
          toast.error(`Gagal menghapus produk: ${error.message}`);
          return;
        }
      }
      
      setProducts(prev => prev.filter(p => p.id !== id));
      toast.success("Produk dihapus");
    } catch (error) {
      console.error("Error in deleteProduct:", error);
      toast.error("Gagal menghapus produk: Terjadi kesalahan");
    }
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
    if (quantity < 0) {
      quantity = 0;
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
  
  // Handle navigation between pages
  const handlePageNavigation = (currentPath: string): void => {
    // Update the previous path reference for next comparison
    previousPathRef.current = currentPath;
  };
  
  // Setup navigation event listener
  useEffect(() => {
    const handlePathChange = () => {
      handlePageNavigation(window.location.pathname);
    };
    
    // Add event listener for popstate (back/forward navigation)
    window.addEventListener('popstate', handlePathChange);
    
    // Cleanup
    return () => {
      window.removeEventListener('popstate', handlePathChange);
    };
  }, []);
  
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
  const addTransaction = async (transaction: Omit<Transaction, 'id'>): Promise<boolean> => {
    if (isAuthenticated) {
      // Start a transaction in Supabase
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
        toast.error(`Gagal menambahkan transaksi: ${transactionError.message}`);
        return false;
      }
      
      if (transactionData && transactionData[0]) {
        const transactionId = transactionData[0].id;
        
        // Add transaction items
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
          toast.error(`Gagal menambahkan item transaksi: ${itemsError.message}`);
          return false;
        }
        
        // Update products stock
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
              toast.error(`Gagal memperbarui stok produk: ${stockError.message}`);
              continue;
            }
          }
        }
        
        // Update capital
        if (transaction.type === 'sale') {
          await addToCapital(transaction.total);
        } else {
          const success = await subtractFromCapital(transaction.total);
          if (!success) return false;
        }
      }
    }
    
    // Fallback to local logic if not connected to Supabase
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
      await addToCapital(transaction.total);
    } else if (transaction.type === 'purchase') {
      // For purchases, increase stock and deduct from capital
      
      // Check if we have enough capital
      const success = await subtractFromCapital(transaction.total);
      if (!success) {
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
  const addExpense = async (expense: Omit<Expense, 'id'>): Promise<boolean> => {
    const success = await subtractFromCapital(expense.amount);
    if (!success) {
      return false;
    }
    
    if (isAuthenticated) {
      const { data, error } = await supabase
        .from('expenses')
        .insert({
          user_id: currentUser?.id,
          date: expense.date.toISOString(),
          amount: expense.amount,
          category: expense.category,
          description: expense.description
        })
        .select();
      
      if (error) {
        console.error("Error adding expense:", error);
        toast.error(`Gagal menambahkan pengeluaran: ${error.message}`);
        return false;
      }
      
      if (data && data[0]) {
        const newExpense = {
          id: data[0].id,
          date: new Date(data[0].date),
          amount: data[0].amount,
          category: data[0].category,
          description: data[0].description
        };
        
        setExpenses(prev => [...prev, newExpense]);
        toast.success(`Pengeluaran dicatat: Rp${expense.amount.toLocaleString('id-ID')}`);
        return true;
      }
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
    handlePageNavigation,
    
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
