import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { toast } from "sonner";
import { supabase, ensureAnonymousUser } from "@/integrations/supabase/client";
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

export type Supplier = {
  id: string;
  name: string;
  phone: string;
  address: string;
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
  customerPhone?: string;
  customerAddress?: string;
  paymentMethod?: 'cash' | 'transfer';
  cashAmount?: number;
  changeAmount?: number;
  supplier?: Supplier;
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
  posCart: CartItem[];
  purchasesCart: CartItem[];
  transactions: Transaction[];
  expenses: Expense[];
  suppliers: Supplier[];
  currentCapital: number; // Alias for capital
  
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
  
  // POS Cart functions
  addToPosCart: (product: Product, quantity: number) => void;
  removeFromPosCart: (productId: string) => void;
  updatePosCartItemQuantity: (productId: string, quantity: number) => void;
  clearPosCart: () => void;
  posCartTotal: () => number;
  posCartProfit: () => number;
  
  // Purchases Cart functions
  addToPurchasesCart: (product: Product, quantity: number) => void;
  removeFromPurchasesCart: (productId: string) => void;
  updatePurchasesCartItemQuantity: (productId: string, quantity: number) => void;
  clearPurchasesCart: () => void;
  purchasesCartTotal: () => number;
  
  handlePageNavigation: (currentPath: string) => void;
  
  // Transaction functions
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<boolean>;
  deleteTransaction: (id: string | undefined, restoreStock?: boolean) => boolean; // Update the type definition
  
  // Expense functions
  addExpense: (expense: Omit<Expense, 'id'>) => Promise<boolean>;
};

// Create the context
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
export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  
  // App state
  const [capital, setCapital] = useState<number>(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [posCart, setPosCart] = useState<CartItem[]>([]);
  const [purchasesCart, setPurchasesCart] = useState<CartItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([
    {
      id: '1',
      name: 'Supplier Default',
      phone: '08123456789',
      address: 'Jl. Supplier No. 123'
    }
  ]);
  const previousPathRef = useRef<string | null>(null);
  
  // Initialize state from localStorage after component mounts
  useEffect(() => {
    const storedUser = getFromLocalStorage("currentUser");
    if (storedUser) {
      setCurrentUser(storedUser);
      setIsAuthenticated(true);
    }
    
    setCapital(getFromLocalStorage("capital", 0));
    setProducts(getFromLocalStorage("products", []));
    setTransactions(getFromLocalStorage("transactions", []));
    setExpenses(getFromLocalStorage("expenses", []));
    setPosCart(getFromLocalStorage("posCart", []));
    setPurchasesCart(getFromLocalStorage("purchasesCart", []));
  }, []);
  
  // Initialize Supabase auth with anonymous auth fallback
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Ensure there's always a session, even if anonymous
        await ensureAnonymousUser().catch(err => {
          console.error("Anonymous auth failed:", err.message);
        });
        
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (event, session) => {
            setSession(session);
            if (session?.user) {
              const user: AppUser = {
                id: session.user.id,
                email: session.user.email || '',
                name: session.user.user_metadata?.name || ''
              };
              setCurrentUser(user);
              setIsAuthenticated(true);
              saveToLocalStorage("currentUser", user);
            } else {
              // If session is lost, create a new anonymous session
              ensureAnonymousUser().catch(err => {
                console.error("Anonymous auth failed:", err.message);
              });
            }
          }
        );
        
        supabase.auth.getSession().then(({ data: { session } }) => {
          setSession(session);
          if (session?.user) {
            const user: AppUser = {
              id: session.user.id,
              email: session.user.email || '',
              name: session.user.user_metadata?.name || ''
            };
            setCurrentUser(user);
            setIsAuthenticated(true);
            saveToLocalStorage("currentUser", user);
          }
        });
        
        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error("Error in initializing auth:", error);
      }
    };
    
    initializeAuth();
  }, []);
  
  // Load initial data from Supabase when authenticated
  useEffect(() => {
    const loadInitialData = async () => {
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
        } catch (error) {
          console.error("Error in loadInitialData:", error);
        }
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
    saveToLocalStorage("posCart", posCart);
    saveToLocalStorage("purchasesCart", purchasesCart);
  }, [capital, products, transactions, expenses, posCart, purchasesCart]);
  
  // Auth functions
  const login = async (email: string, password: string): Promise<void> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      throw new Error(error.message);
    }
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
  };
  
  const logout = async (): Promise<void> => {
    await supabase.auth.signOut();
    // Create a new anonymous session immediately after logout
    setTimeout(() => ensureAnonymousUser().catch(err => {
      console.error("Anonymous auth failed:", err.message);
    }), 100);
  };
  
  // Capital functions
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
  
  // Product functions
  const addProduct = async (product: Omit<Product, 'id'>): Promise<void> => {
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
        toast.error(`Gagal menambahkan produk: ${error.message}`, {
          duration: 1000
        });
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
        toast.success(`Produk ditambahkan: ${product.name}`, {
          duration: 1000
        });
        return;
      }
    }
    
    const newProduct = {
      ...product,
      id: Date.now().toString(),
    };
    
    setProducts(prev => [...prev, newProduct]);
    toast.success(`Produk ditambahkan: ${product.name}`, {
      duration: 1000
    });
  };
  
  const updateProduct = async (product: Product): Promise<void> => {
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
        toast.error(`Gagal memperbarui produk: ${error.message}`, {
          duration: 1000
        });
        return;
      }
    }
    
    setProducts(prev => 
      prev.map(p => p.id === product.id ? product : p)
    );
    toast.success(`Produk diperbarui: ${product.name}`, {
      duration: 1000
    });
  };
  
  const deleteProduct = async (id: string): Promise<void> => {
    try {
      const { data: transactionItems, error: checkError } = await supabase
        .from('transaction_items')
        .select('id')
        .eq('product_id', id)
        .limit(1);
      
      if (checkError) {
        console.error("Error checking product usage:", checkError);
        toast.error(`Gagal memeriksa produk: ${checkError.message}`, {
          duration: 1000
        });
        return;
      }
      
      if (transactionItems && transactionItems.length > 0) {
        toast.error("Produk tidak dapat dihapus karena sudah digunakan dalam transaksi", {
          duration: 1000
        });
        return;
      }
      
      if (isAuthenticated) {
        const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', id);
        
        if (error) {
          console.error("Error deleting product:", error);
          toast.error(`Gagal menghapus produk: ${error.message}`, {
            duration: 1000
          });
          return;
        }
      }
      
      setProducts(prev => prev.filter(p => p.id !== id));
      toast.success("Produk dihapus");
    } catch (error) {
      console.error("Error in deleteProduct:", error);
      toast.error("Gagal menghapus produk: Terjadi kesalahan", {
        duration: 1000
      });
    }
  };
  
  // POS Cart functions
  const addToPosCart = (product: Product, quantity: number): void => {
    const existingItem = posCart.find(item => item.product.id === product.id);
    
    if (existingItem) {
      updatePosCartItemQuantity(
        product.id, 
        existingItem.quantity + quantity
      );
      return;
    }
    
    setPosCart(prev => [...prev, { product, quantity }]);
  };
  
  const removeFromPosCart = (productId: string): void => {
    setPosCart(prev => prev.filter(item => item.product.id !== productId));
  };
  
  const updatePosCartItemQuantity = (productId: string, quantity: number): void => {
    if (quantity < 0) {
      quantity = 0;
    }
    
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    if (quantity > product.stock) {
      toast.error("Stok tidak mencukupi", {
        duration: 1000
      });
      return;
    }
    
    setPosCart(prev => 
      prev.map(item => 
        item.product.id === productId 
          ? { ...item, quantity } 
          : item
      )
    );
  };
  
  const clearPosCart = (): void => {
    setPosCart([]);
  };
  
  const posCartTotal = (): number => {
    return posCart.reduce(
      (total, item) => total + (item.product.price * item.quantity), 
      0
    );
  };
  
  const posCartProfit = (): number => {
    return posCart.reduce(
      (total, item) => 
        total + ((item.product.price - item.product.supplierPrice) * item.quantity), 
      0
    );
  };
  
  // Purchases Cart functions
  const addToPurchasesCart = (product: Product, quantity: number): void => {
    const existingItem = purchasesCart.find(item => item.product.id === product.id);
    
    if (existingItem) {
      updatePurchasesCartItemQuantity(
        product.id, 
        existingItem.quantity + quantity
      );
      return;
    }
    
    setPurchasesCart(prev => [...prev, { product, quantity }]);
  };
  
  const removeFromPurchasesCart = (productId: string): void => {
    setPurchasesCart(prev => prev.filter(item => item.product.id !== productId));
  };
  
  const updatePurchasesCartItemQuantity = (productId: string, quantity: number): void => {
    if (quantity < 0) {
      quantity = 0;
    }
    
    setPurchasesCart(prev => 
      prev.map(item => 
        item.product.id === productId 
          ? { ...item, quantity } 
          : item
      )
    );
  };
  
  const clearPurchasesCart = (): void => {
    setPurchasesCart([]);
  };
  
  const purchasesCartTotal = (): number => {
    return purchasesCart.reduce(
      (total, item) => total + (item.product.supplierPrice * item.quantity), 
      0
    );
  };
  
  // Legacy Cart functions (kept for backward compatibility)
  const addToCart = (product: Product, quantity: number): void => {
    const path = window.location.pathname;
    if (path.includes('/purchases')) {
      addToPurchasesCart(product, quantity);
    } else {
      addToPosCart(product, quantity);
    }
  };
  
  const removeFromCart = (productId: string): void => {
    const path = window.location.pathname;
    if (path.includes('/purchases')) {
      removeFromPurchasesCart(productId);
    } else {
      removeFromPosCart(productId);
    }
  };
  
  const updateCartItemQuantity = (productId: string, quantity: number): void => {
    const path = window.location.pathname;
    if (path.includes('/purchases')) {
      updatePurchasesCartItemQuantity(productId, quantity);
    } else {
      updatePosCartItemQuantity(productId, quantity);
    }
  };
  
  const clearCart = (): void => {
    const path = window.location.pathname;
    if (path.includes('/purchases')) {
      clearPurchasesCart();
    } else {
      clearPosCart();
    }
  };
  
  const cartTotal = (): number => {
    const path = window.location.pathname;
    if (path.includes('/purchases')) {
      return purchasesCartTotal();
    } else {
      return posCartTotal();
    }
  };
  
  const cartProfit = (): number => {
    return posCartProfit();
  };
  
  // Handle navigation between pages
  const handlePageNavigation = (currentPath: string): void => {
    previousPathRef.current = currentPath;
    
    if (currentPath.includes('/purchases')) {
      setCart(purchasesCart);
    } else {
      setCart(posCart);
    }
  };
  
  useEffect(() => {
    const handlePathChange = () => {
      handlePageNavigation(window.location.pathname);
    };
    
    window.addEventListener('popstate', handlePathChange);
    handlePathChange();
    
    return () => {
      window.removeEventListener('popstate', handlePathChange);
    };
  }, [posCart, purchasesCart]);
  
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
