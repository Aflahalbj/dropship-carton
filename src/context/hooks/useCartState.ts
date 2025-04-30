
import { useState, useEffect, useRef } from 'react';
import { CartItem, Product } from '../types';
import { getFromLocalStorage, saveToLocalStorage } from '../utils';
import { toast } from "sonner";

export const useCartState = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [posCart, setPosCart] = useState<CartItem[]>([]);
  const [purchasesCart, setPurchasesCart] = useState<CartItem[]>([]);
  const previousPathRef = useRef<string | null>(null);

  // Initialize state from localStorage after component mounts
  useEffect(() => {
    setPosCart(getFromLocalStorage("posCart", []));
    setPurchasesCart(getFromLocalStorage("purchasesCart", []));
  }, []);

  // Persist state changes to localStorage
  useEffect(() => {
    saveToLocalStorage("posCart", posCart);
    saveToLocalStorage("purchasesCart", purchasesCart);
  }, [posCart, purchasesCart]);

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
  
  const updatePosCartItemQuantity = (productId: string, quantity: number, products: Product[] = []): void => {
    if (quantity < 0) {
      quantity = 0;
    }
    
    const product = products.find(p => p.id === productId);
    if (product && quantity > product.stock) {
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
  
  const updateCartItemQuantity = (productId: string, quantity: number, products: Product[] = []): void => {
    const path = window.location.pathname;
    if (path.includes('/purchases')) {
      updatePurchasesCartItemQuantity(productId, quantity);
    } else {
      updatePosCartItemQuantity(productId, quantity, products);
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

  return {
    cart,
    posCart,
    purchasesCart,
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
    addToCart,
    removeFromCart,
    updateCartItemQuantity,
    clearCart,
    cartTotal,
    cartProfit,
    handlePageNavigation
  };
};
