
import React, { useState, useRef, useEffect } from 'react';
import { useAppContext, Product } from '../context/AppContext';
import { Search, Plus, Minus, ShoppingCart, X, Check, Printer } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Receipt from '../components/Receipt';
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useReactToPrint } from 'react-to-print';
import { useLocation } from 'react-router-dom';

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
    addTransaction,
    handlePageNavigation
  } = useAppContext();
  
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [showCheckout, setShowCheckout] = useState(false);
  const [isCartVisible, setIsCartVisible] = useState(false);
  const [isOnPurchasePage, setIsOnPurchasePage] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<{
    id: string;
    date: Date;
    items: typeof cart;
    total: number;
  } | null>(null);
  
  const receiptRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const isPurchase = location.pathname.includes('/purchases');
    setIsOnPurchasePage(isPurchase);
    if (isPurchase) {
      setShowCheckout(false);
    }
    
    handlePageNavigation(location.pathname);
  }, [location, handlePageNavigation]);
  
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handlePrint = useReactToPrint({
    documentTitle: 'Struk Penjualan',
    contentRef: receiptRef,
    onAfterPrint: () => {
      toast.success('Struk berhasil dicetak!');
    }
  });
  
  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error("Keranjang kosong");
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
      toast.error("Stok tidak mencukupi untuk beberapa barang");
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
      
      toast.success("Penjualan berhasil dilakukan!");
      clearCart();
      setShowCheckout(false);
    }
  };
  
  const shouldShowCartIcon = cart.length > 0 && !showCheckout && !isOnPurchasePage;
  
  return (
    <div className="animate-slide-up">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Kasir</h2>
          <p className="text-muted-foreground">Proses transaksi dengan cepat dan efisien</p>
        </div>
        
        {cart.length > 0 && !showCheckout && !isOnPurchasePage && (
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
            Kembali ke Produk
          </Button>
        )}
      </div>
      
      {!showCheckout ? (
        <>
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
            <Input
              type="text"
              placeholder="Cari produk berdasarkan nama atau SKU..."
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
              <p className="text-muted-foreground">Tidak ada produk yang cocok dengan pencarian Anda.</p>
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
      
      {shouldShowCartIcon && (
        <Button
          className="fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-lg bg-primary text-white hover:bg-primary/90 transition-all"
          onClick={() => setShowCheckout(true)}
        >
          <div className="relative">
            <ShoppingCart size={24} />
            <span className="absolute -top-2 -right-2 bg-white text-primary rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
              {cart.length}
            </span>
          </div>
        </Button>
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
              <p className="text-lg font-semibold">Rp{product.price.toLocaleString('id-ID')}</p>
            </div>
            <div className="bg-accent rounded-md px-2 py-1">
              <span className="text-sm font-medium">{product.stock} stok</span>
            </div>
          </div>
          
          <div className="flex mt-3 justify-between">
            <span className="text-xs bg-primary/10 text-primary font-medium px-2 py-1 rounded-full">
              Rp{(product.price - product.supplierPrice).toLocaleString('id-ID')} profit
            </span>
            <Button 
              size="sm" 
              className="h-8 bg-primary text-white"
              onClick={() => addToCart(product, 1)}
              disabled={product.stock <= 0}
            >
              Tambah ke Keranjang
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
          <h3 className="text-lg font-medium mb-2">Keranjang Anda kosong</h3>
          <p className="text-muted-foreground mb-4">Tambahkan produk ke keranjang untuk checkout</p>
          
          {lastTransaction && (
            <div className="mb-4">
              <p className="text-green-600 font-medium mb-2">Penjualan terakhir Anda berhasil diselesaikan!</p>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="mx-2">
                    Lihat Struk
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
                Cetak Struk
              </Button>
            </div>
          )}
          
          <Button onClick={() => setShowCheckout(false)}>
            Telusuri Produk
          </Button>
        </div>
      );
    }
    
    return (
      <div className="animate-slide-up">
        <div className="border rounded-lg overflow-hidden mb-6">
          <div className="bg-accent p-3 border-b">
            <h3 className="font-medium">Item Keranjang</h3>
          </div>
          
          <div className="divide-y">
            {cart.map((item) => (
              <div key={item.product.id} className="p-4 flex justify-between items-center">
                <div className="flex-1">
                  <h4 className="font-medium">{item.product.name}</h4>
                  <p className="text-sm text-muted-foreground">{item.product.sku}</p>
                </div>
                
                <div className="w-24">
                  <Input
                    type="text"
                    placeholder="0"
                    className="w-full h-8 text-center text-sm font-medium"
                    defaultValue={item.quantity > 0 ? item.quantity.toString() : ""}
                    onBlur={(e) => {
                      const newValue = e.target.value.trim();
                      const newQuantity = newValue === "" ? 0 : parseInt(newValue);
                      if (!isNaN(newQuantity)) {
                        // Check stock limit for POS
                        if (newQuantity > item.product.stock) {
                          toast.error(`Stok ${item.product.name} hanya tersedia ${item.product.stock}`);
                          updateCartItemQuantity(item.product.id, item.product.stock);
                        } else {
                          updateCartItemQuantity(item.product.id, newQuantity);
                        }
                      }
                    }}
                    onChange={(e) => {
                      // Allow only numbers in the input
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      e.target.value = value;
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const target = e.target as HTMLInputElement;
                        const newValue = target.value.trim();
                        const newQuantity = newValue === "" ? 0 : parseInt(newValue);
                        if (!isNaN(newQuantity)) {
                          // Check stock limit for POS
                          if (newQuantity > item.product.stock) {
                            toast.error(`Stok ${item.product.name} hanya tersedia ${item.product.stock}`);
                            updateCartItemQuantity(item.product.id, item.product.stock);
                          } else {
                            updateCartItemQuantity(item.product.id, newQuantity);
                          }
                        }
                        target.blur();
                      }
                    }}
                  />
                </div>
                
                <div className="text-right ml-4 w-24">
                  <div className="font-medium">Rp{(item.product.price * item.quantity).toLocaleString('id-ID')}</div>
                  <div className="text-xs text-muted-foreground">Rp{item.product.price.toLocaleString('id-ID')} per unit</div>
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
              <span>Rp{cartTotal().toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span className="text-muted-foreground">Estimasi Profit:</span>
              <span className="text-primary">Rp{cartProfit().toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between text-lg font-semibold">
              <span>Total:</span>
              <span>Rp{cartTotal().toLocaleString('id-ID')}</span>
            </div>
          </div>
          
          <div className="flex gap-4">
            <Button 
              variant="outline"
              className="flex-1"
              onClick={() => clearCart()}
            >
              Kosongkan Keranjang
            </Button>
            <Button 
              className="flex-1 bg-primary text-white flex items-center justify-center gap-2"
              onClick={onCheckout}
            >
              <Check size={18} />
              Selesaikan Penjualan
            </Button>
          </div>
        </div>
      </div>
    );
  }
};

export default POS;
