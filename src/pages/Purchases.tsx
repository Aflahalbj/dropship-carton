
import React, { useState } from 'react';
import { useAppContext, Product } from '../context/AppContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Search, Package, Plus, Minus, ShoppingCart, X, Check } from 'lucide-react';
import { toast } from "sonner";

const Purchases = () => {
  const { 
    products, 
    cart, 
    addToCart, 
    removeFromCart, 
    updateCartItemQuantity, 
    clearCart, 
    cartTotal,
    addTransaction
  } = useAppContext();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showCheckout, setShowCheckout] = useState(false);
  
  // Filter products based on search term
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handlePurchase = () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    
    // For purchases, we create a transaction with type 'purchase'
    // The supplier price is used as the product price for purchases
    const purchaseProducts = cart.map(item => ({
      product: {
        ...item.product,
        price: item.product.supplierPrice // Use supplier price for purchases
      },
      quantity: item.quantity
    }));
    
    const purchaseTotal = purchaseProducts.reduce(
      (total, item) => total + (item.product.price * item.quantity), 
      0
    );
    
    const transaction = {
      date: new Date(),
      products: purchaseProducts,
      total: purchaseTotal,
      profit: 0, // Purchases don't generate profit
      type: 'purchase' as const
    };
    
    const success = addTransaction(transaction);
    
    if (success) {
      toast.success("Purchase completed successfully!");
      clearCart();
      setShowCheckout(false);
    }
  };
  
  return (
    <div className="animate-slide-up">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Purchase Inventory</h2>
          <p className="text-muted-foreground">Restock your inventory from suppliers</p>
        </div>
        
        {cart.length > 0 && !showCheckout && (
          <Button
            className="bg-primary text-white flex items-center gap-2"
            onClick={() => setShowCheckout(true)}
          >
            <ShoppingCart size={18} />
            <span>Checkout</span>
            <span className="ml-1 bg-white text-primary rounded-full w-6 h-6 flex items-center justify-center text-sm">
              {cart.reduce((total, item) => total + item.quantity, 0)}
            </span>
          </Button>
        )}
        
        {showCheckout && (
          <Button
            variant="outline"
            className="border-primary text-primary flex items-center gap-2"
            onClick={() => setShowCheckout(false)}
          >
            <X size={18} />
            Back to Products
          </Button>
        )}
      </div>
      
      {!showCheckout ? (
        <>
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
            <Input
              type="text"
              placeholder="Search products by name or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          
          {filteredProducts.length === 0 && (
            <div className="text-center py-10">
              <p className="text-muted-foreground">No products found matching your search.</p>
            </div>
          )}
        </>
      ) : (
        <CartView onCheckout={handlePurchase} />
      )}
    </div>
  );
  
  function ProductCard({ product }: { product: Product }) {
    return (
      <Card className="overflow-hidden card-hover">
        <div className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium">{product.name}</h3>
              <p className="text-sm text-muted-foreground mb-1">{product.sku}</p>
              <p className="text-lg font-semibold">${product.supplierPrice.toFixed(2)}</p>
            </div>
            <div className="bg-accent rounded-md px-2 py-1">
              <span className="text-sm font-medium">{product.stock} in stock</span>
            </div>
          </div>
          
          <div className="flex mt-3 justify-end">
            <Button 
              size="sm" 
              className="h-8 bg-primary text-white"
              onClick={() => addToCart(product, 1)}
            >
              Add to Cart
            </Button>
          </div>
        </div>
      </Card>
    );
  }
  
  function CartView({ onCheckout }: { onCheckout: () => void }) {
    if (cart.length === 0) {
      return (
        <div className="text-center py-10">
          <ShoppingCart size={48} className="mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Your cart is empty</h3>
          <p className="text-muted-foreground mb-4">Add products to your cart to purchase</p>
          <Button onClick={() => setShowCheckout(false)}>
            Browse Products
          </Button>
        </div>
      );
    }
    
    // Calculate purchase total based on supplier price
    const purchaseTotal = cart.reduce(
      (total, item) => total + (item.product.supplierPrice * item.quantity), 
      0
    );
    
    return (
      <div className="animate-slide-up">
        <div className="border rounded-lg overflow-hidden mb-6">
          <div className="bg-accent p-3 border-b">
            <h3 className="font-medium">Cart Items</h3>
          </div>
          
          <div className="divide-y">
            {cart.map((item) => (
              <div key={item.product.id} className="p-4 flex justify-between items-center">
                <div className="flex-1">
                  <h4 className="font-medium">{item.product.name}</h4>
                  <p className="text-sm text-muted-foreground">{item.product.sku}</p>
                </div>
                
                <div className="flex items-center gap-2 w-32">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={() => updateCartItemQuantity(item.product.id, item.quantity - 1)}
                  >
                    <Minus size={16} />
                  </Button>
                  
                  <span className="w-8 text-center">{item.quantity}</span>
                  
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={() => updateCartItemQuantity(item.product.id, item.quantity + 1)}
                  >
                    <Plus size={16} />
                  </Button>
                </div>
                
                <div className="text-right ml-4 w-24">
                  <div className="font-medium">${(item.product.supplierPrice * item.quantity).toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground">${item.product.supplierPrice.toFixed(2)} each</div>
                </div>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-2 text-muted-foreground hover:text-destructive"
                  onClick={() => removeFromCart(item.product.id)}
                >
                  <X size={18} />
                </Button>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-card border rounded-lg p-5">
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-lg font-semibold">
              <span>Total Purchase Amount:</span>
              <span>${purchaseTotal.toFixed(2)}</span>
            </div>
          </div>
          
          <div className="flex gap-4">
            <Button 
              variant="outline"
              className="flex-1"
              onClick={() => clearCart()}
            >
              Clear Cart
            </Button>
            <Button 
              className="flex-1 bg-primary text-white flex items-center justify-center gap-2"
              onClick={onCheckout}
            >
              <Check size={18} />
              Complete Purchase
            </Button>
          </div>
        </div>
      </div>
    );
  }
};

export default Purchases;
