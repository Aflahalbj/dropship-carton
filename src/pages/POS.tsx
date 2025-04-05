
import React, { useState, useRef, useEffect } from 'react';
import { useAppContext, Product } from '../context/AppContext';
import { Search, Plus, Minus, ShoppingCart, X, Check, Printer, User, CreditCard, Wallet } from 'lucide-react';
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
  
  // Add filter state variables
  const [priceFilter, setPriceFilter] = useState<string>("all");
  const [stockFilter, setStockFilter] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<string>("name-asc");
  
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer'>('cash');
  const [customerName, setCustomerName] = useState<string>('');
  const [cashAmount, setCashAmount] = useState<string>('');
  
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
    // Apply text search filter
    const matchesSearch = 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Apply price filter
    let matchesPrice = true;
    if (priceFilter === "low") {
      matchesPrice = product.price < 50000;
    } else if (priceFilter === "medium") {
      matchesPrice = product.price >= 50000 && product.price <= 100000;
    } else if (priceFilter === "high") {
      matchesPrice = product.price > 100000;
    }
    
    // Apply stock filter
    let matchesStock = true;
    if (stockFilter === "out") {
      matchesStock = product.stock === 0;
    } else if (stockFilter === "low") {
      matchesStock = product.stock > 0 && product.stock <= 5;
    } else if (stockFilter === "available") {
      matchesStock = product.stock > 5;
    }
    
    return matchesSearch && matchesPrice && matchesStock;
  }).sort((a, b) => {
    // Apply sorting
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
  
  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error("Keranjang kosong");
      return;
    }
    
    const total = cart.reduce((sum, item) => {
      const price = discountedPrices[item.product.id] || item.product.price;
      return sum + (price * item.quantity);
    }, 0);
    
    const profit = cart.reduce((sum, item) => {
      const price = discountedPrices[item.product.id] || item.product.price;
      return sum + ((price - item.product.supplierPrice) * item.quantity);
    }, 0);
    
    let changeAmount = 0;
    if (paymentMethod === 'cash' && cashAmount) {
      const cashValue = parseFloat(cashAmount.replace(/[^\d]/g, ''));
      if (!isNaN(cashValue)) {
        changeAmount = cashValue - total;
        if (changeAmount < 0) {
          toast.error("Jumlah uang tunai tidak mencukupi");
          return;
        }
      } else {
        toast.error("Masukkan jumlah uang tunai yang valid");
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
      cashAmount: cashAmount ? parseFloat(cashAmount.replace(/[^\d]/g, '')) : undefined,
      changeAmount: changeAmount > 0 ? changeAmount : undefined,
      paymentMethod: paymentMethod,
      customerName: customerName || 'Pelanggan'
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
        items: modifiedCart,
        total: total,
        paymentMethod: paymentMethod,
        customerName: customerName || 'Pelanggan',
        cashAmount: paymentMethod === 'cash' && cashAmount ? parseFloat(cashAmount.replace(/[^\d]/g, '')) : undefined,
        changeAmount: paymentMethod === 'cash' ? changeAmount : undefined
      });
      
      toast.success("Penjualan berhasil dilakukan!");
      clearCart();
      setDiscountedPrices({});
      setCashAmount('');
      setCustomerName('');
      setShowCheckout(false);
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
          <div className="mb-6">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                type="text"
                placeholder="Cari produk berdasarkan nama atau SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Filter Controls */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Filter Harga
                </label>
                <Select value={priceFilter} onValueChange={setPriceFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Semua harga" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua harga</SelectItem>
                    <SelectItem value="low">&lt; Rp50.000</SelectItem>
                    <SelectItem value="medium">Rp50.000 - Rp100.000</SelectItem>
                    <SelectItem value="high">&gt; Rp100.000</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Filter Stok
                </label>
                <Select value={stockFilter} onValueChange={setStockFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Semua stok" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua stok</SelectItem>
                    <SelectItem value="out">Stok habis</SelectItem>
                    <SelectItem value="low">Stok menipis (≤ 5)</SelectItem>
                    <SelectItem value="available">Stok tersedia (&gt; 5)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Urutkan
                </label>
                <Select value={sortOrder} onValueChange={setSortOrder}>
                  <SelectTrigger>
                    <SelectValue placeholder="Urutkan berdasarkan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name-asc">Nama (A-Z)</SelectItem>
                    <SelectItem value="name-desc">Nama (Z-A)</SelectItem>
                    <SelectItem value="price-asc">Harga (Terendah-Tertinggi)</SelectItem>
                    <SelectItem value="price-desc">Harga (Tertinggi-Terendah)</SelectItem>
                    <SelectItem value="stock-asc">Stok (Terendah-Tertinggi)</SelectItem>
                    <SelectItem value="stock-desc">Stok (Tertinggi-Terendah)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    setSearchTerm('');
                    setPriceFilter('all');
                    setStockFilter('all');
                    setSortOrder('name-asc');
                  }}
                >
                  Reset Filter
                </Button>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          
          {filteredProducts.length === 0 && (
            <div className="text-center py-10">
              <p className="text-muted-foreground">Tidak ada produk yang cocok dengan filter Anda.</p>
            </div>
          )}
        </>
      ) : (
        <CartView 
          onCheckout={handleCheckout} 
          lastTransaction={lastTransaction}
          onPrintReceipt={handlePrint}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          cashAmount={cashAmount}
          setCashAmount={setCashAmount}
          customerName={customerName}
          setCustomerName={setCustomerName}
          discountedPrices={discountedPrices}
          handleUpdateItemPrice={handleUpdateItemPrice}
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
    return (
      <Card className="overflow-hidden card-hover h-full flex flex-col">
        {product.image && (
          <div className="h-32 overflow-hidden">
            <img 
              src={product.image} 
              alt={product.name}
              className="w-full h-full object-cover"
              onError={(e) => (e.target as HTMLImageElement).src = 'https://placehold.co/300x150?text=No+Image'} 
            />
          </div>
        )}
        <div className="p-4 flex-grow">
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
          
          <div className="mt-3">
            <Button 
              size="sm" 
              className="w-full h-8 bg-primary text-white"
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
    onPrintReceipt,
    paymentMethod,
    setPaymentMethod,
    cashAmount,
    setCashAmount,
    customerName,
    setCustomerName,
    discountedPrices,
    handleUpdateItemPrice
  }: { 
    onCheckout: () => void; 
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
    paymentMethod: 'cash' | 'transfer';
    setPaymentMethod: (method: 'cash' | 'transfer') => void;
    cashAmount: string;
    setCashAmount: (amount: string) => void;
    customerName: string;
    setCustomerName: (name: string) => void;
    discountedPrices: {[key: string]: number};
    handleUpdateItemPrice: (productId: string, newPrice: number) => void;
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
    
    const changeAmount = paymentMethod === 'cash' ? 
      cashAmount && parseFloat(cashAmount.replace(/[^\d]/g, '')) - total : 0;
    
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
                          const target = e.target as HTMLInputElement;
                          target.blur();
                        }
                      }}
                    />
                  </div>
                  
                  <div className="text-right w-32 ml-4">
                    <Input
                      type="number"
                      className="w-full h-8 text-right text-sm font-medium"
                      value={discountedPrices[item.product.id] || item.product.price}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        if (!isNaN(value)) {
                          handleUpdateItemPrice(item.product.id, value);
                        }
                      }}
                    />
                    <div className="text-xs text-muted-foreground mt-1">
                      {discountedPrices[item.product.id] && 
                        discountedPrices[item.product.id] !== item.product.price ? 
                        <span className="line-through">Rp{item.product.price.toLocaleString('id-ID')}</span> : 
                        'Harga asli'}
                    </div>
                  </div>
                  
                  <div className="text-right ml-4 w-24">
                    <div className="font-medium">
                      Rp{((discountedPrices[item.product.id] || item.product.price) * 
                        item.quantity).toLocaleString('id-ID')}
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
              ))}
            </div>
          </div>
        </div>
        
        <div className="md:col-span-1">
          <Card className="p-5">
            <h3 className="font-medium text-lg mb-4">Informasi Pembayaran</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Nama Pelanggan (Opsional)
                </label>
                <div className="flex rounded-md overflow-hidden">
                  <div className="bg-accent flex items-center justify-center px-3 border border-r-0 border-input">
                    <User size={16} className="text-muted-foreground" />
                  </div>
                  <Input 
                    placeholder="Nama pelanggan" 
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="rounded-l-none"
                    onKeyDown={(e) => {
                      // Prevent Enter key from submitting form
                      if (e.key === 'Enter') {
                        e.preventDefault();
                      }
                    }}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Metode Pembayaran
                </label>
                <Tabs 
                  defaultValue="cash" 
                  className="w-full" 
                  value={paymentMethod} 
                  onValueChange={(v) => setPaymentMethod(v as 'cash' | 'transfer')}
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="cash" className="flex items-center gap-1">
                      <Wallet size={16} />
                      Tunai
                    </TabsTrigger>
                    <TabsTrigger value="transfer" className="flex items-center gap-1">
                      <CreditCard size={16} />
                      Transfer
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="cash" className="space-y-4 mt-2">
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1">
                        Jumlah Uang Tunai
                      </label>
                      <Input
                        type="text"
                        value={cashAmount}
                        onChange={(e) => {
                          const value = e.target.value;
                          setCashAmount(value);
                        }}
                        placeholder="Masukkan jumlah uang"
                        onKeyDown={(e) => {
                          // Prevent Enter key from submitting form
                          if (e.key === 'Enter') {
                            e.preventDefault();
                          }
                        }}
                      />
                      {cashAmount && (
                        <p className="text-sm mt-1">
                          Kembalian: Rp{Math.max(0, parseFloat(cashAmount.replace(/[^\d]/g, '') || '0') - total).toLocaleString('id-ID')}
                        </p>
                      )}
                    </div>
                    
                    <div className="pt-2 border-t">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Kembalian:</span>
                        <span className="font-medium">
                          Rp{changeAmount > 0 ? changeAmount.toLocaleString('id-ID') : '0'}
                        </span>
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="transfer" className="space-y-4 mt-2">
                    <div className="p-2 bg-accent rounded-md text-sm">
                      Pembayaran akan dilakukan melalui transfer bank
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
              
              <div className="space-y-3 pt-4 border-t">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span>Rp{total.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-muted-foreground">Estimasi Profit:</span>
                  <span className="text-primary">Rp{profit.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total:</span>
                  <span>Rp{total.toLocaleString('id-ID')}</span>
                </div>
              </div>
              
              <Button 
                className="w-full bg-primary text-white flex items-center justify-center gap-2 mt-4"
                onClick={onCheckout}
                disabled={
                  paymentMethod === 'cash' && cashAmount && parseFloat(cashAmount.replace(/[^\d]/g, '')) < total
                }
              >
                <Check size={18} />
                Selesaikan Penjualan
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }
};

export default POS;
