import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { toast } from "sonner";
import { useAppContext } from "@/context/AppContext";
import { Product } from "@/context/types";
import { Input } from "@/components/ui/input";
import { Search, ArrowUpDown, ShoppingCart, X, Check, ChevronsLeft, Trash2 } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { CheckoutForm } from '@/components/CheckoutForm';
import type { CheckoutFormData } from '@/components/CheckoutForm';
import CartItemPriceEditor from '@/components/CartItemPriceEditor';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const POS: React.FC = () => {
  const {
    products,
    posCart,
    addTransaction,
    posCartTotal,
    handlePageNavigation,
    clearPosCart
  } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<string>("name-asc");
  const [showCheckout, setShowCheckout] = useState(false);
  const location = useLocation();
  useEffect(() => {
    handlePageNavigation(location.pathname);
  }, [location, handlePageNavigation]);
  const filteredProducts = products.filter(product => product.name.toLowerCase().includes(searchTerm.toLowerCase()) || product.sku.toLowerCase().includes(searchTerm.toLowerCase())).sort((a, b) => {
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
  const handleCheckout = (formData: CheckoutFormData) => {
    if (posCart.length === 0) {
      toast.error("Keranjang kosong", {
        duration: 1000
      });
      return;
    }
    const transaction = {
      date: new Date(),
      products: posCart,
      total: posCartTotal(),
      profit: posCart.reduce((total, item) => total + (item.product.price - item.product.supplierPrice) * item.quantity, 0),
      type: 'sale' as const,
      customerName: formData.customerName,
      customerPhone: formData.customerPhone,
      customerAddress: formData.customerAddress,
      paymentMethod: formData.paymentMethod as 'cash' | 'transfer',
      cashAmount: formData.cashAmount,
      changeAmount: formData.changeAmount
    };
    const success = addTransaction(transaction);
    if (success) {
      toast.success("Transaksi berhasil!", {
        duration: 1000
      });
      setShowCheckout(false);
    } else {
      toast.error("Transaksi gagal!", {
        duration: 1000
      });
    }
  };
  const ProductCard = ({
    product
  }: {
    product: Product;
  }) => {
    const {
      addToPosCart
    } = useAppContext();
    const handleAddToCart = () => {
      if (product.stock > 0) {
        addToPosCart(product, 1);
        toast.success(`${product.name} ditambahkan ke keranjang`, {
          duration: 1000
        });
      } else {
        toast.error(`${product.name} stok kosong`, {
          duration: 1000
        });
      }
    };
    return <Card className="overflow-hidden card-hover h-full flex flex-col cursor-pointer" onClick={handleAddToCart}>
        <div className="h-auto overflow-hidden flex items-center justify-center px-0 py-0 my-0 mx-0">
          <AspectRatio ratio={1 / 1} className="w-full">
            <Avatar className="w-full h-full rounded-none">
              <AvatarImage src={product.image} alt={product.name} className="w-full h-full object-cover" />
              <AvatarFallback className="rounded-none text-4xl" aria-label={product.name} />
            </Avatar>
          </AspectRatio>
        </div>
        <div className="p-2 flex-grow px-[10px] py-[10px]">
          <div className="flex justify-between items-start">
            <div className="w-full">
              <h3 className="font-medium text-xs">{product.name}</h3>
              <p className="text-xs text-muted-foreground">
                {product.sku} • {product.stock} stok
              </p>
              <p className="text-sm font-semibold">Rp{product.price.toLocaleString('id-ID')}</p>
            </div>
          </div>
        </div>
      </Card>;
  };
  const CartView = ({
    onCheckout
  }: {
    onCheckout: (formData: CheckoutFormData) => void;
  }) => {
    const {
      posCart,
      removeFromPosCart,
      updatePosCartItemQuantity,
      clearPosCart,
      posCartTotal,
      posCartProfit
    } = useAppContext();
    const [isProcessing, setIsProcessing] = useState(false);
    const [temporaryPrices, setTemporaryPrices] = useState<Record<string, number>>({});
    if (posCart.length === 0) {
      return <div className="text-center py-10">
          <ShoppingCart size={48} className="mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Keranjang Anda kosong</h3>
          <p className="text-muted-foreground mb-4">Tambahkan produk ke keranjang untuk melakukan penjualan</p>
        </div>;
    }
    const handlePriceChange = (productId: string, newPrice: number) => {
      setTemporaryPrices(prev => ({
        ...prev,
        [productId]: newPrice
      }));
    };
    const handleSubmit = (formData: CheckoutFormData) => {
      setIsProcessing(true);
      const modifiedCart = posCart.map(item => {
        if (temporaryPrices[item.product.id]) {
          return {
            ...item,
            product: {
              ...item.product,
              price: temporaryPrices[item.product.id]
            }
          };
        }
        return item;
      });
      onCheckout({
        ...formData,
        modifiedCart
      });
    };
    return <div className="animate-slide-up grid gap-6 md:grid-cols-5">
        <div className="md:col-span-3">
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-accent p-3 border-b flex justify-between items-center">
              <h3 className="font-medium">Item Keranjang</h3>
              
            </div>
            
            <div className="divide-y">
              {posCart.map(item => {
              const discountedPrice = temporaryPrices[item.product.id];
              return <div key={item.product.id} className="p-4 flex justify-between items-center">
                  <div className="flex-1">
                    {item.product.image && <div className="w-10 h-10 rounded mr-3 overflow-hidden float-left">
                        <Avatar className="w-full h-full rounded-none">
                          <AvatarImage src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                          <AvatarFallback className="rounded-none" aria-label={item.product.name} />
                        </Avatar>
                      </div>}
                    <div>
                      <h4 className="font-medium">{item.product.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {item.quantity} × Rp{(discountedPrice || item.product.price).toLocaleString('id-ID')} = Rp{((discountedPrice || item.product.price) * item.quantity).toLocaleString('id-ID')}
                      </p>
                      
                      <CartItemPriceEditor productId={item.product.id} originalPrice={item.product.price} discountedPrice={discountedPrice} onPriceChange={handlePriceChange} />
                    </div>
                  </div>
                  
                  <div className="w-20">
                    <Input type="text" placeholder="0" defaultValue={item.quantity > 0 ? item.quantity.toString() : ""} onBlur={e => {
                    const newValue = e.target.value.trim();
                    const newQuantity = newValue === "" ? 0 : parseInt(newValue);
                    if (!isNaN(newQuantity)) {
                      updatePosCartItemQuantity(item.product.id, newQuantity);
                    }
                  }} onChange={e => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    e.target.value = value;
                  }} onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.currentTarget.blur();
                    }
                  }} className="w-10 h-10 text-center text-sm font-medium px-0 mx-[47px]" />
                  </div>
                  
                  <Button variant="ghost" size="icon" className="ml-2 text-muted-foreground hover:text-destructive" onClick={() => removeFromPosCart(item.product.id)}>
                    <X size={18} />
                  </Button>
                </div>;
            })}
            </div>
          </div>
        </div>
        
        <div className="md:col-span-2">
          <CheckoutForm cartTotal={posCart.reduce((total, item) => {
          const itemPrice = temporaryPrices[item.product.id] || item.product.price;
          return total + itemPrice * item.quantity;
        }, 0)} cartProfit={posCart.reduce((total, item) => {
          const itemPrice = temporaryPrices[item.product.id] || item.product.price;
          return total + (itemPrice - item.product.supplierPrice) * item.quantity;
        }, 0)} onSubmit={handleSubmit} isProcessing={isProcessing} />
        </div>
      </div>;
  };
  const shouldShowCartIcon = posCart.length > 0 && !showCheckout;
  const handleClearCartAndReturn = () => {
    clearPosCart();
    setShowCheckout(false);
    toast.success("Keranjang dikosongkan", {
      duration: 1000
    });
  };
  
  return (
      <>
        <div className="flex justify-between items-center mb-6">
          {showCheckout && <Button variant="ghost" size="icon" onClick={() => setShowCheckout(false)} className="mr-4">
            <ChevronsLeft size={24} />
          </Button>}
          
          <div className="w-full text-center">
            <h2 className="text-3xl font-bold tracking-tight text-left">Kasir</h2>
            <p className="text-muted-foreground text-left">Proses penjualan produk</p>
          </div>
          
          {posCart.length > 0 && <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={handleClearCartAndReturn}>
              <Trash2 size={20} />
            </Button>}
        </div>

        {!showCheckout ? <>
            <div className="mb-6 flex flex-wrap gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
                <Input type="text" placeholder="Cari produk berdasarkan nama atau SKU..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 mx-0" />
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <ArrowUpDown size={16} />
                    <span className="hidden sm:inline">Urutkan</span>
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
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 px-0 mx-0 my-0 py-0">
              {filteredProducts.map(product => <ProductCard key={product.id} product={product} />)}
            </div>
            
            {filteredProducts.length === 0 && <div className="text-center py-10">
                <p className="text-muted-foreground">Tidak ada produk yang cocok dengan pencarian Anda.</p>
              </div>}
          </> : <CartView onCheckout={handleCheckout} />}
        
        {shouldShowCartIcon && <Button className="fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-lg bg-primary text-white hover:bg-primary/90 transition-all" onClick={() => setShowCheckout(true)}>
            <div className="relative">
              <ShoppingCart size={24} />
              <span className="absolute -top-2 -right-2 bg-white text-primary rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold px-0 py-[3px] my-[-5px] mx-[-5px]">
                {posCart.length}
              </span>
            </div>
          </Button>}
      </>
  );
};
export default POS;
