import React, { useState, useRef, useEffect } from 'react';
import { useAppContext, Product } from '../context/AppContext';
import { Search, Plus, Minus, ShoppingCart, X, Check, Printer, User, CreditCard, Wallet, ArrowUpDown } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Receipt from '../components/Receipt';
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useReactToPrint } from 'react-to-print';
import { useLocation } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CheckoutForm, CheckoutFormData } from "@/components/CheckoutForm";
import CartItemPriceEditor from '@/components/CartItemPriceEditor';
import { supabase, ensureAnonymousUser } from '@/integrations/supabase/client';

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
  const [discountedPrices, setDiscountedPrices] = useState<{[key: string]: number}>({});
  const [lastTransaction, setLastTransaction] = useState<{
    id: string;
    date: Date;
    items: typeof cart;
    total: number;
    paymentMethod: string;
    customerName: string;
    cashAmount?: number;
    changeAmount?: number;
  } | null>(null);
  
  const [sortOrder, setSortOrder] = useState<string>("name-asc");
  const [isProcessing, setIsProcessing] = useState(false);
  
  const receiptRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const isPurchase = location.pathname.includes('/purchases');
    setIsOnPurchasePage(isPurchase);
    if (isPurchase) {
      setShowCheckout(false);
    }
    
    handlePageNavigation(location.pathname);
  }, [location, handlePageNavigation]);
  
  const filteredProducts = products.filter(product => {
    return product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
           product.sku.toLowerCase().includes(searchTerm.toLowerCase());
  }).sort((a, b) => {
    switch (sortOrder) {
      case "name-asc":
        return a.name.localeCompare(b.name);
      case "name-desc":
        return b.name.localeCompare(a.name);
      case "price-asc":
        return a.price - b.price;
      case "price-desc":
        return b.price - a.price;
      case "stock-asc":
        return a.stock - b.stock;
      case "stock-desc":
        return b.stock - a.stock;
      default:
        return 0;
    }
  });
  
  const handlePrint = useReactToPrint({
    documentTitle: 'Struk Penjualan',
    contentRef: receiptRef,
    onAfterPrint: () => {
      toast.success('Struk berhasil dicetak!');
    }
  });
  
  const handleCheckout = async (formData: CheckoutFormData) => {
    if (cart.length === 0) {
      toast.error("Keranjang kosong");
      return;
    }
    
    setIsProcessing(true);
    
    try {
      await ensureAnonymousUser();
      
      const total = cart.reduce((sum, item) => {
        const price = discountedPrices[item.product.id] || item.product.price;
        return sum + (price * item.quantity);
      }, 0);
      
      const profit = cart.reduce((sum, item) => {
        const price = discountedPrices[item.product.id] || item.product.price;
        return sum + ((price - item.product.supplierPrice) * item.quantity);
      }, 0);
      
      let changeAmount = 0;
      if (formData.paymentMethod === 'cash') {
        changeAmount = Math.max(0, formData.cashAmount - total);
        if (changeAmount < 0) {
          toast.error("Jumlah uang tunai tidak mencukupi");
          setIsProcessing(false);
          return;
        }
      }
      
      const modifiedCart = cart.map(item => ({
        ...item,
        product: {
          ...item.product,
          price: discountedPrices[item.product.id] || item.product.price
        }
      }));
      
      const transaction = {
        date: new Date(),
        products: modifiedCart,
        total: total,
        profit: profit,
        type: 'sale' as const,
        cashAmount: formData.paymentMethod === 'cash' ? formData.cashAmount : undefined,
        changeAmount: changeAmount > 0 ? changeAmount : undefined,
        paymentMethod: formData.paymentMethod,
        customerName: formData.customerName || 'Pelanggan'
      };
      
      const hasInsufficientStock = cart.some(item => item.quantity > item.product.stock);
      
      if (hasInsufficientStock) {
        toast.error("Stok tidak mencukupi untuk beberapa barang");
        setIsProcessing(false);
        return;
      }
      
      const success = await addTransaction(transaction);
      
      if (success) {
        setLastTransaction({
          id: Date.now().toString(),
          date: new Date(),
          items: modifiedCart,
          total: total,
          paymentMethod: formData.paymentMethod,
          customerName: formData.customerName || 'Pelanggan',
          cashAmount: formData.paymentMethod === 'cash' ? formData.cashAmount : undefined,
          changeAmount: formData.paymentMethod === 'cash' ? changeAmount : undefined
        });
        
        toast.success("Penjualan berhasil dilakukan!");
        clearCart();
        setDiscountedPrices({});
        setShowCheckout(false);
      }
    } catch (error) {
      toast.error("Terjadi kesalahan saat memproses penjualan");
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleUpdateItemPrice = (productId: string, newPrice: number) => {
    if (newPrice <= 0) {
      const updatedPrices = {...discountedPrices};
      delete updatedPrices[productId];
      setDiscountedPrices(updatedPrices);
      return;
    }
    
    setDiscountedPrices({
      ...discountedPrices,
      [productId]: newPrice
    });
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
          <div className="mb-6 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                type="text"
                placeholder="Cari produk berdasarkan nama atau SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2 px-3">
                  <ArrowUpDown size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setSortOrder("name-asc")}>
                  Nama (A-Z)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOrder("name-desc")}>
                  Nama (Z-A)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOrder("price-asc")}>
                  Harga (Terendah-Tertinggi)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOrder("price-desc")}>
                  Harga (Tertinggi-Terendah)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOrder("stock-asc")}>
                  Stok (Terendah-Tertinggi)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOrder("stock-desc")}>
                  Stok (Tertinggi-Terendah)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
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
          discountedPrices={discountedPrices}
          handleUpdateItemPrice={handleUpdateItemPrice}
          isProcessing={isProcessing}
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
            paymentMethod={lastTransaction.paymentMethod}
            customerName={lastTransaction.customerName}
            cashAmount={lastTransaction.cashAmount}
            changeAmount={lastTransaction.changeAmount}
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
    const defaultImage = "https://placehold.co/300x150?text=Produk";
    return (
      <Card 
        className="overflow-hidden card-hover h-full flex flex-col cursor-pointer"
        onClick={() => {
          if (product.stock > 0) {
            addToCart(product, 1);
            toast.success(`${product.name} ditambahkan ke keranjang`);
          } else {
            toast.error(`${product.name} stok kosong`);
          }
        }}
      >
        <div className="h-32 overflow-hidden">
          <img 
            src={product.image || defaultImage} 
            alt={product.name}
            className="w-full h-full object-cover"
            onError={(e) => (e.target as HTMLImageElement).src = defaultImage} 
          />
        </div>
        <div className="p-4 flex-grow">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium">{product.name}</h3>
              <p className="text-sm text-muted-foreground mb-1">{product.sku}</p>
              <p className="text-lg font-semibold">Rp{product.price.toLocaleString('id-ID')}</p>
            </div>
            <div className={`rounded-md px-2 py-1 ${
              product.stock === 0 
                ? 'bg-red-100 text-red-600'
                : product.stock <= 5
                  ? 'bg-amber-100 text-amber-600'
                  : 'bg-green-100 text-green-600'
            }`}>
              <span className="text-sm font-medium">{product.stock} stok</span>
            </div>
          </div>
        </div>
      </Card>
    );
  }
  
  function CartView({ 
    onCheckout, 
    lastTransaction,
    onPrintReceipt,
    discountedPrices,
    handleUpdateItemPrice,
    isProcessing
  }: { 
    onCheckout: (formData: CheckoutFormData) => void;
    lastTransaction: {
      id: string;
      date: Date;
      items: typeof cart;
      total: number;
      paymentMethod: string;
      customerName: string;
      cashAmount?: number;
      changeAmount?: number;
    } | null;
    onPrintReceipt: () => void;
    discountedPrices: {[key: string]: number};
    handleUpdateItemPrice: (productId: string, newPrice: number) => void;
    isProcessing: boolean;
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
                    paymentMethod={lastTransaction.paymentMethod}
                    customerName={lastTransaction.customerName}
                    cashAmount={lastTransaction.cashAmount}
                    changeAmount={lastTransaction.changeAmount}
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
    
    const total = cart.reduce((sum, item) => {
      const price = discountedPrices[item.product.id] || item.product.price;
      return sum + (price * item.quantity);
    }, 0);
    
    const profit = cart.reduce((sum, item) => {
      const price = discountedPrices[item.product.id] || item.product.price;
      return sum + ((price - item.product.supplierPrice) * item.quantity);
    }, 0);
    
    return (
      <div className="animate-slide-up grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div className="border rounded-lg overflow-hidden mb-6">
            <div className="bg-accent p-3 border-b flex justify-between items-center">
              <h3 className="font-medium">Item Keranjang</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => clearCart()} 
                className="text-muted-foreground hover:text-destructive"
              >
                Kosongkan
              </Button>
            </div>
            
            <div className="divide-y">
              {cart.map((item) => (
                <div key={item.product.id} className="p-4">
                  <div className="flex justify-between items-center">
                    <div className="w-24 mr-4">
                      <Input
                        type="text"
                        placeholder="0"
                        className="w-full h-8 text-center text-sm font-medium"
                        defaultValue={item.quantity > 0 ? item.quantity.toString() : ""}
                        onBlur={(e) => {
                          const newValue = e.target.value.trim();
                          const newQuantity = newValue === "" ? 0 : parseInt(newValue);
                          if (!isNaN(newQuantity)) {
                            if (newQuantity > item.product.stock) {
                              toast.error(`Stok ${item.product.name} hanya tersedia ${item.product.stock}`);
                              updateCartItemQuantity(item.product.id, item.product.stock);
                            } else {
                              updateCartItemQuantity(item.product.id, newQuantity);
                            }
                          }
                        }}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9]/g, '');
                          e.target.value = value;
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.currentTarget.blur();
                          }
                        }}
                      />
                    </div>
                    
                    <div className="flex-1">
                      <h4 className="font-medium">{item.product.name}</h4>
                    </div>
                    
                    <div className="text-right ml-4 w-24">
                      <div className="font-medium">
                        Rp{((discountedPrices[item.product.id] || item.product.price) * 
                          item.quantity).toLocaleString('id-ID')}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {discountedPrices[item.product.id] && 
                          discountedPrices[item.product.id] !== item.product.price ? 
                          <span className="line-through">Rp{item.product.price.toLocaleString('id-ID')}</span> : 
                          'Harga asli'}
                      </div>
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
                  
                  <CartItemPriceEditor
                    productId={item.product.id}
                    originalPrice={item.product.price}
                    discountedPrice={discountedPrices[item.product.id]}
                    onPriceChange={handleUpdateItemPrice}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="md:col-span-1">
          <CheckoutForm
            cartTotal={total}
            cartProfit={profit}
            onSubmit={onCheckout}
            isProcessing={isProcessing}
          />
        </div>
      </div>
    );
  }
};

export default POS;
