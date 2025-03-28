
import React, { useState, useRef } from 'react';
import { useAppContext, Product } from '../context/AppContext';
import { Search, Plus, Minus, ShoppingCart, X, Check, Printer } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Receipt from '../components/Receipt';
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useReactToPrint } from 'react-to-print';

const POS = () => {
  const { 
    products, 
    cart, 
    addToCart, 
    removeFromCart, 
    updateCartItemQuantity, 
    clearCart, 
    cartTotal, 
    cartProfit,
    addTransaction
  } = useAppContext();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showCheckout, setShowCheckout] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<{
    id: string;
    date: Date;
    items: typeof cart;
    total: number;
  } | null>(null);
  
  const receiptRef = useRef<HTMLDivElement>(null);
  
  // Filter products based on search term
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handlePrint = useReactToPrint({
    documentTitle: 'Sales Receipt',
    contentRef: receiptRef,
    onAfterPrint: () => {
      toast.success('Receipt printed successfully!');
    }
  });
  
  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    
    const transaction = {
      date: new Date(),
      products: [...cart],
      total: cartTotal(),
      profit: cartProfit(),
      type: 'sale' as const
    };
    
    const hasInsufficientStock = cart.some(item => item.quantity > item.product.stock);
    
    if (hasInsufficientStock) {
      toast.error("Insufficient stock for some items");
      return;
    }
    
    const success = addTransaction(transaction);
    
    if (success) {
      setLastTransaction({
        id: Date.now().toString(),
        date: new Date(),
        items: [...cart],
        total: cartTotal()
      });
      
      toast.success("Sale completed successfully!");
      clearCart();
      setShowCheckout(false);
    }
  };
  
  return (
    <div className="animate-slide-up">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Point of Sale</h2>
          <p className="text-muted-foreground">Process transactions quickly and efficiently</p>
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
        <CartView 
          onCheckout={handleCheckout} 
          lastTransaction={lastTransaction}
          onPrintReceipt={handlePrint}
        />
      )}
      
      <div className="hidden">
        {lastTransaction && (
          <Receipt
            ref={receiptRef}
            items={lastTransaction.items}
            total={lastTransaction.total}
            date={lastTransaction.date}
            transactionId={lastTransaction.id}
          />
        )}
      </div>
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
              <p className="text-lg font-semibold">${product.price.toFixed(2)}</p>
            </div>
            <div className="bg-accent rounded-md px-2 py-1">
              <span className="text-sm font-medium">{product.stock} in stock</span>
            </div>
          </div>
          
          <div className="flex mt-3 justify-between">
            <span className="text-xs bg-primary/10 text-primary font-medium px-2 py-1 rounded-full">
              ${(product.price - product.supplierPrice).toFixed(2)} profit
            </span>
            <Button 
              size="sm" 
              className="h-8 bg-primary text-white"
              onClick={() => addToCart(product, 1)}
              disabled={product.stock <= 0}
            >
              Add to Cart
            </Button>
          </div>
        </div>
      </Card>
    );
  }
  
  function CartView({ 
    onCheckout, 
    lastTransaction, 
    onPrintReceipt 
  }: { 
    onCheckout: () => void; 
    lastTransaction: {
      id: string;
      date: Date;
      items: typeof cart;
      total: number;
    } | null;
    onPrintReceipt: () => void;
  }) {
    if (cart.length === 0) {
      return (
        <div className="text-center py-10">
          <ShoppingCart size={48} className="mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Your cart is empty</h3>
          <p className="text-muted-foreground mb-4">Add products to your cart to checkout</p>
          
          {lastTransaction && (
            <div className="mb-4">
              <p className="text-green-600 font-medium mb-2">Your last sale was completed successfully!</p>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="mx-2">
                    View Receipt
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[90vh] overflow-auto">
                  <Receipt
                    items={lastTransaction.items}
                    total={lastTransaction.total}
                    date={lastTransaction.date}
                    transactionId={lastTransaction.id}
                  />
                </DialogContent>
              </Dialog>
              
              <Button 
                variant="secondary" 
                className="mx-2 bg-blue-100 text-blue-700 hover:bg-blue-200"
                onClick={onPrintReceipt}
              >
                <Printer size={16} className="mr-2" />
                Print Receipt
              </Button>
            </div>
          )}
          
          <Button onClick={() => setShowCheckout(false)}>
            Browse Products
          </Button>
        </div>
      );
    }
    
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
                    disabled={item.quantity >= item.product.stock}
                  >
                    <Plus size={16} />
                  </Button>
                </div>
                
                <div className="text-right ml-4 w-24">
                  <div className="font-medium">${(item.product.price * item.quantity).toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground">${item.product.price.toFixed(2)} each</div>
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
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal:</span>
              <span>${cartTotal().toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span className="text-muted-foreground">Estimated Profit:</span>
              <span className="text-primary">${cartProfit().toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-semibold">
              <span>Total:</span>
              <span>${cartTotal().toFixed(2)}</span>
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
              Complete Sale
            </Button>
          </div>
        </div>
      </div>
    );
  }
};

export default POS;
