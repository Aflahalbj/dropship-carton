import React, { useState, useEffect } from 'react';
import { useAppContext, Product, CartItem } from '../context/AppContext'; // Added CartItem import
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Search, Package, Plus, Minus, ShoppingCart, X, Check, ArrowUpDown } from 'lucide-react';
import { toast } from "sonner";
import { useLocation } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import CartItemPriceEditor from '@/components/CartItemPriceEditor';

const Purchases = () => {
  const {
    products,
    purchasesCart,
    addToPurchasesCart,
    removeFromPurchasesCart,
    updatePurchasesCartItemQuantity,
    clearPurchasesCart,
    purchasesCartTotal,
    addTransaction,
    capital,
    handlePageNavigation
  } = useAppContext();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [showCheckout, setShowCheckout] = useState(false);
  const [sortOrder, setSortOrder] = useState<string>("name-asc");
  const [temporaryPrices, setTemporaryPrices] = useState<Record<string, number>>({});

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
        return a.supplierPrice - b.supplierPrice;
      case "price-desc":
        return b.supplierPrice - a.supplierPrice;
      case "stock-asc":
        return a.stock - b.stock;
      case "stock-desc":
        return b.stock - a.stock;
      default:
        return 0;
    }
  });

  const handlePurchase = () => {
    if (purchasesCart.length === 0) {
      toast.error("Keranjang kosong");
      return;
    }
    const purchaseProducts = purchasesCart.map(item => ({
      product: {
        ...item.product,
        price: item.product.supplierPrice
      },
      quantity: item.quantity
    }));
    const purchaseTotal = purchaseProducts.reduce((total, item) => total + item.product.price * item.quantity, 0);
    if (purchaseTotal > capital) {
      toast.error(`Modal tidak mencukupi untuk pembelian ini! Modal saat ini: Rp${capital.toLocaleString('id-ID')}, Total pembelian: Rp${purchaseTotal.toLocaleString('id-ID')}`);
      return;
    }
    const transaction = {
      date: new Date(),
      products: purchaseProducts,
      total: purchaseTotal,
      profit: 0,
      type: 'purchase' as const
    };
    const success = addTransaction(transaction);
    if (success) {
      toast.success("Pembelian berhasil dilakukan!");
      setShowCheckout(false);
    } else {
      toast.error("Modal tidak mencukupi untuk pembelian ini!");
    }
  };

  const shouldShowCartIcon = purchasesCart.length > 0 && !showCheckout;

  return <div className="container mx-auto animate-slide-up py-[10px] px-[20px]">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-center">Pembelian Persediaan</h2>
          <p className="text-muted-foreground text-center">Tambah stok barang dari pemasok</p>
        </div>
        
        {purchasesCart.length > 0 && !showCheckout}
        
        {showCheckout && <Button variant="outline" className="border-primary text-primary flex items-center gap-2" onClick={() => setShowCheckout(false)}>
            <X size={18} />
            Kembali ke Produk
          </Button>}
      </div>
      
      {!showCheckout ? <>
          <div className="mb-6 flex flex-wrap gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
              <Input type="text" placeholder="Cari produk berdasarkan nama atau SKU..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
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
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {filteredProducts.map(product => <ProductCard 
              key={product.id} 
              product={product} 
              onAddToCart={addToPurchasesCart}
            />)}
          </div>
          
          {filteredProducts.length === 0 && <div className="text-center py-10">
              <p className="text-muted-foreground">Tidak ada produk yang cocok dengan pencarian Anda.</p>
            </div>}
        </> : <CartView 
              onCheckout={handlePurchase} 
              purchasesCart={purchasesCart}
              capital={capital}
              clearPurchasesCart={clearPurchasesCart}
              removeFromPurchasesCart={removeFromPurchasesCart}
              updatePurchasesCartItemQuantity={updatePurchasesCartItemQuantity}
              setShowCheckout={setShowCheckout}
            />}
      
      {shouldShowCartIcon && <Button onClick={() => setShowCheckout(true)} className="fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-lg bg-primary hover:bg-primary/90 transition-all font-normal text-white px-0 py-0 mx-0 text-base">
          <div className="relative px-[5px] py-[5px]">
            <ShoppingCart size={24} />
            <span className="absolute -top-2 -right-2 bg-white text-primary rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
              {purchasesCart.length}
            </span>
          </div>
        </Button>}
    </div>;
};

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product, quantity: number) => void;
}

function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const defaultImage = "https://placehold.co/300x150?text=Produk";
  return <Card className="overflow-hidden card-hover h-full flex flex-col cursor-pointer" onClick={() => {
    onAddToCart(product, 1);
    toast.success(`${product.name} ditambahkan ke keranjang`, {
      duration: 3000
    });
  }}>
    <div className="h-auto overflow-hidden flex items-center justify-center rounded-none px-0 py-0 mx-0 my-0">
      <AspectRatio ratio={1 / 1} className="w-full">
        <img src={product.image || defaultImage} alt={product.name} onError={e => (e.target as HTMLImageElement).src = defaultImage} className="w-full h-full object-cover" />
      </AspectRatio>
    </div>
    <div className="p-2 flex-grow">
      <div className="flex justify-between items-start">
        <div className="w-full">
          <h3 className="font-medium text-xs">{product.name}</h3>
          <p className="text-xs text-muted-foreground">{product.sku} • {product.stock} stok</p>
          <p className="text-sm font-semibold">Rp{product.supplierPrice.toLocaleString('id-ID')}</p>
        </div>
      </div>
    </div>
  </Card>;
}

interface CartViewProps {
  onCheckout: () => void;
  purchasesCart: CartItem[];
  capital: number;
  clearPurchasesCart: () => void;
  removeFromPurchasesCart: (productId: string) => void;
  updatePurchasesCartItemQuantity: (productId: string, quantity: number) => void;
  setShowCheckout: React.Dispatch<React.SetStateAction<boolean>>;
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
                {item.product.image && <div className="w-10 h-10 rounded mr-3 overflow-hidden float-left">
                    <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" onError={e => (e.target as HTMLImageElement).src = "https://placehold.co/300x150?text=Produk"} />
                  </div>}
                <h4 className="font-medium">{item.product.name}</h4>
                <p className="text-sm text-muted-foreground">
                  {item.quantity} × Rp{(discountedPrice || item.product.supplierPrice).toLocaleString('id-ID')} = Rp{((discountedPrice || item.product.supplierPrice) * item.quantity).toLocaleString('id-ID')}
                </p>
                
                <CartItemPriceEditor 
                  productId={item.product.id}
                  originalPrice={item.product.supplierPrice}
                  discountedPrice={discountedPrice}
                  onPriceChange={handlePriceChange}
                />
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
            </div>
          })}
        </div>
      </div>
      
      <div className="bg-card border rounded-lg p-5">
        <div className="space-y-3 mb-6">
          <div className="flex justify-between text-lg font-semibold">
            <span>Total Pembelian:</span>
            <span>Rp{purchaseTotal.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Modal Saat Ini:</span>
            <span className="font-medium">Rp{capital.toLocaleString('id-ID')}</span>
          </div>
          {purchaseTotal > capital && <div className="text-destructive text-sm mt-2">
              Modal tidak mencukupi untuk pembelian ini!
            </div>}
        </div>
        
        <div className="flex gap-4">
          <Button variant="outline" className="flex-1" onClick={() => clearPurchasesCart()}>
            Kosongkan Keranjang
          </Button>
          <Button className="flex-1 bg-primary text-white flex items-center justify-center gap-2" onClick={() => {
            const modifiedCart = purchasesCart.map(item => {
              if (temporaryPrices[item.product.id]) {
                return {
                  product: {
                    ...item.product,
                    supplierPrice: temporaryPrices[item.product.id]
                  },
                  quantity: item.quantity
                };
              }
              return item;
            });
            
            const purchaseProducts = modifiedCart.map(item => ({
              product: {
                ...item.product,
                price: item.product.supplierPrice
              },
              quantity: item.quantity
            }));
            
            const updatedPurchaseTotal = purchaseProducts.reduce(
              (total, item) => total + item.product.price * item.quantity, 
              0
            );
            
            if (updatedPurchaseTotal > capital) {
              toast.error(`Modal tidak mencukupi untuk pembelian ini! Modal saat ini: Rp${capital.toLocaleString('id-ID')}, Total pembelian: Rp${updatedPurchaseTotal.toLocaleString('id-ID')}`);
              return;
            }
            
            const transaction = {
              date: new Date(),
              products: purchaseProducts,
              total: updatedPurchaseTotal,
              profit: 0,
              type: 'purchase' as const
            };
            
            const success = onCheckout();
            if (success) {
              toast.success("Pembelian berhasil dilakukan!");
              setShowCheckout(false);
            } else {
              toast.error("Modal tidak mencukupi untuk pembelian ini!");
            }
          }} disabled={purchaseTotal > capital}>
            <Check size={18} />
            Selesaikan Pembelian
          </Button>
        </div>
      </div>
    </div>;
}

export default Purchases;
