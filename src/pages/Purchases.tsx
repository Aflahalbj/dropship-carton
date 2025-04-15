
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

// Add a simple Purchases component as the default export
const Purchases = () => {
  // You can add the actual implementation here when needed
  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Halaman Pembelian</h1>
      <p className="text-muted-foreground mb-6">Kelola pembelian produk dari supplier</p>
      {/* Rest of your Purchases component code */}
    </div>
  );
};

export default Purchases;

