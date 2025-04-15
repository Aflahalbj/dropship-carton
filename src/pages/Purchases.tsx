import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShoppingCart, X } from "lucide-react";
import CartItemPriceEditor from '@/components/CartItemPriceEditor';
import { PurchaseCheckoutForm } from '@/components/PurchaseCheckoutForm';

// Define the CartViewProps interface
interface CartViewProps {
  onCheckout: () => void;
  purchasesCart: Array<{
    product: {
      id: string;
      name: string;
      supplierPrice: number;
    };
    quantity: number;
  }>;
  capital: number;
  clearPurchasesCart: () => void;
  removeFromPurchasesCart: (productId: string) => void;
  updatePurchasesCartItemQuantity: (productId: string, quantity: number) => void;
  setShowCheckout: (show: boolean) => void;
}

function CartView({
  onCheckout,
  purchasesCart,
  capital,
  clearPurchasesCart,
  removeFromPurchasesCart,
  updatePurchasesCartItemQuantity,
  setShowCheckout
}: CartViewProps) {
  const [temporaryPrices, setTemporaryPrices] = useState<Record<string, number>>({});
  const [isProcessing, setIsProcessing] = useState(false);

  if (purchasesCart.length === 0) {
    return <div className="text-center py-10">
        <ShoppingCart size={48} className="mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">Keranjang Anda kosong</h3>
        <p className="text-muted-foreground mb-4">Tambahkan produk ke keranjang untuk melakukan pembelian</p>
        <Button onClick={() => setShowCheckout(false)}>
          Telusuri Produk
        </Button>
      </div>;
  }

  const handlePriceChange = (productId: string, newPrice: number) => {
    setTemporaryPrices(prev => ({
      ...prev,
      [productId]: newPrice
    }));
  };

  const purchaseTotal = purchasesCart.reduce((total, item) => {
    const itemPrice = temporaryPrices[item.product.id] || item.product.supplierPrice;
    return total + itemPrice * item.quantity;
  }, 0);

  const handleCheckout = () => {
    setIsProcessing(true);
    const modifiedCart = purchasesCart.map(item => {
      if (temporaryPrices[item.product.id]) {
        return {
          ...item,
          product: {
            ...item.product,
            supplierPrice: temporaryPrices[item.product.id]
          }
        };
      }
      return item;
    });
    onCheckout();
    setIsProcessing(false);
  };

  return <div className="animate-slide-up">
      <div className="border rounded-lg overflow-hidden mb-6">
        <div className="bg-accent p-3 border-b flex justify-between items-center">
          <h3 className="font-medium">Item Keranjang</h3>
          <Button variant="ghost" size="sm" onClick={() => clearPurchasesCart()} className="text-muted-foreground hover:text-destructive">
            Kosongkan
          </Button>
        </div>
        
        <div className="divide-y">
          {purchasesCart.map(item => {
          const discountedPrice = temporaryPrices[item.product.id];
          return <div key={item.product.id} className="p-4 flex justify-between items-center">
              <div className="flex-1">
                <h4 className="font-medium">{item.product.name}</h4>
                <p className="text-sm text-muted-foreground">
                  {item.quantity} × Rp{(discountedPrice || item.product.supplierPrice).toLocaleString('id-ID')} = Rp{((discountedPrice || item.product.supplierPrice) * item.quantity).toLocaleString('id-ID')}
                </p>
                
                <CartItemPriceEditor productId={item.product.id} originalPrice={item.product.supplierPrice} discountedPrice={discountedPrice} onPriceChange={handlePriceChange} />
              </div>
              
              <div className="w-20">
                <Input type="text" placeholder="0" className="w-full h-8 text-center text-sm font-medium" defaultValue={item.quantity > 0 ? item.quantity.toString() : ""} onBlur={e => {
                const newValue = e.target.value.trim();
                const newQuantity = newValue === "" ? 0 : parseInt(newValue);
                if (!isNaN(newQuantity)) {
                  updatePurchasesCartItemQuantity(item.product.id, newQuantity);
                }
              }} onChange={e => {
                const value = e.target.value.replace(/[^0-9]/g, '');
                e.target.value = value;
              }} onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur();
                }
              }} />
              </div>
              
              <div className="text-right ml-4 w-24">
                <div className="font-medium">Rp{((discountedPrice || item.product.supplierPrice) * item.quantity).toLocaleString('id-ID')}</div>
                <div className="text-xs text-muted-foreground">Rp{(discountedPrice || item.product.supplierPrice).toLocaleString('id-ID')} per unit</div>
              </div>
              
              <Button variant="ghost" size="icon" className="ml-2 text-muted-foreground hover:text-destructive" onClick={() => removeFromPurchasesCart(item.product.id)}>
                <X size={18} />
              </Button>
            </div>;
        })}
        </div>
      </div>
      
      <PurchaseCheckoutForm purchaseTotal={purchaseTotal} currentCapital={capital} onCheckout={handleCheckout} isProcessing={isProcessing} />
    </div>;
}

const Purchases = () => {
  const [purchasesCart, setPurchasesCart] = useState<Array<{
    product: { id: string; name: string; supplierPrice: number; };
    quantity: number;
  }>>([]);
  
  const [showCheckout, setShowCheckout] = useState(false);
  
  const [capital, setCapital] = useState(5000000);
  
  const clearPurchasesCart = () => {
    setPurchasesCart([]);
  };
  
  const removeFromPurchasesCart = (productId: string) => {
    setPurchasesCart(prev => prev.filter(item => item.product.id !== productId));
  };
  
  const updatePurchasesCartItemQuantity = (productId: string, quantity: number) => {
    setPurchasesCart(prev => prev.map(item => 
      item.product.id === productId ? { ...item, quantity } : item
    ));
  };
  
  const handleCheckout = () => {
    clearPurchasesCart();
    setShowCheckout(false);
  };
  
  const mockProducts = [
    { id: "prod1", name: "Kemeja Polos", supplierPrice: 55000 },
    { id: "prod2", name: "Celana Jeans", supplierPrice: 120000 },
    { id: "prod3", name: "Kaos Oblong", supplierPrice: 35000 },
    { id: "prod4", name: "Jaket Hoodie", supplierPrice: 150000 },
    { id: "prod5", name: "Topi Baseball", supplierPrice: 25000 }
  ];
  
  const addToCart = (product: typeof mockProducts[0]) => {
    setPurchasesCart(prev => {
      const existingItem = prev.find(item => item.product.id === product.id);
      if (existingItem) {
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      } else {
        return [...prev, { product, quantity: 1 }];
      }
    });
  };
  
  return (
    <div className="py-6">
      <h1 className="text-2xl font-bold mb-2">Halaman Pembelian</h1>
      <p className="text-muted-foreground mb-6">Kelola pembelian produk dari supplier</p>
      
      <div className="grid md:grid-cols-2 gap-6">
        {showCheckout ? (
          <CartView 
            onCheckout={handleCheckout}
            purchasesCart={purchasesCart}
            capital={capital}
            clearPurchasesCart={clearPurchasesCart}
            removeFromPurchasesCart={removeFromPurchasesCart}
            updatePurchasesCartItemQuantity={updatePurchasesCartItemQuantity}
            setShowCheckout={setShowCheckout}
          />
        ) : (
          <div className="space-y-6">
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-accent p-3 border-b">
                <h3 className="font-medium">Produk Supplier</h3>
              </div>
              <div className="divide-y">
                {mockProducts.map(product => (
                  <div key={product.id} className="p-4 flex justify-between items-center">
                    <div>
                      <h4 className="font-medium">{product.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Rp{product.supplierPrice.toLocaleString('id-ID')}
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => addToCart(product)}
                    >
                      + Tambahkan
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-accent p-3 border-b flex justify-between items-center">
            <h3 className="font-medium">Keranjang Pembelian</h3>
            {purchasesCart.length > 0 && !showCheckout && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowCheckout(true)}
              >
                Checkout
              </Button>
            )}
          </div>
          
          <div className="p-4">
            {purchasesCart.length === 0 ? (
              <div className="text-center py-10">
                <ShoppingCart size={36} className="mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">Belum ada produk di keranjang</p>
              </div>
            ) : (
              <div className="divide-y">
                {purchasesCart.map(item => (
                  <div key={item.product.id} className="py-2 flex justify-between items-center">
                    <div>
                      <h4 className="font-medium">{item.product.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {item.quantity} × Rp{item.product.supplierPrice.toLocaleString('id-ID')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        Rp{(item.quantity * item.product.supplierPrice).toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
                ))}
                
                <div className="py-2 pt-4 flex justify-between items-center">
                  <h4 className="font-medium">Total</h4>
                  <p className="font-bold">
                    Rp{purchasesCart.reduce((total, item) => total + (item.quantity * item.product.supplierPrice), 0).toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Purchases;
