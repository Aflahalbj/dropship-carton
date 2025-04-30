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
export interface AppContextType {
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
  deleteTransaction: (id: string, restoreStock?: boolean) => boolean;
  
  // Expense functions
  addExpense: (expense: Omit<Expense, 'id'>) => Promise<boolean>;
}
