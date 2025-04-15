import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAppContext, Product, Supplier } from "@/context/AppContext";
import { Search, ArrowUpDown, ShoppingCart, X, Plus, ChevronsLeft, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { PurchaseCheckoutForm } from '@/components/PurchaseCheckoutForm';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from '@/components/FormInputs';

const Purchases: React.FC = () => {
  const {
    products,
    suppliers,
    addTransaction,
    currentCapital
  } = useAppContext();
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<{
    product: Product;
    quantity: number;
    price: number;
  }[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<string>("name-asc");
  const [showCheckout, setShowCheckout] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

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

  const resetForm = () => {
    setSelectedSupplier(null);
    setSelectedProducts([]);
    setShowCheckout(false);
    setIsProcessing(false);
  };

  const handleAddProduct = (product: Product) => {
    const existingProductIndex = selectedProducts.findIndex(item => item.product.id === product.id);
    if (existingProductIndex > -1) {
      const updatedProducts = [...selectedProducts];
      updatedProducts[existingProductIndex].quantity += 1;
      setSelectedProducts(updatedProducts);
    } else {
      setSelectedProducts([...selectedProducts, {
        product: product,
        quantity: 1,
        price: product.supplierPrice
      }]);
    }
    toast.success(`${product.name} ditambahkan ke daftar pembelian`, {
      duration: 1000
    });
  };

  const handleRemoveProduct = (productId: string) => {
    setSelectedProducts(selectedProducts.filter(item => item.product.id !== productId));
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    const updatedProducts = selectedProducts.map(item => item.product.id === productId ? {
      ...item,
      quantity
    } : item);
    setSelectedProducts(updatedProducts);
  };

  const handleUpdatePrice = (productId: string, price: number) => {
    const updatedProducts = selectedProducts.map(item => item.product.id === productId ? {
      ...item,
      price
    } : item);
    setSelectedProducts(updatedProducts);
  };

  const handleCheckout = () => {
    if (!selectedSupplier) {
      toast.error("Pilih supplier terlebih dahulu", {
        duration: 1000
      });
      return;
    }
    if (selectedProducts.length === 0) {
      toast.error("Tidak ada produk yang dipilih", {
        duration: 1000
      });
      return;
    }
    setIsProcessing(true);
    const purchaseTotal = selectedProducts.reduce((total, item) => total + item.quantity * item.price, 0);
    const transaction = {
      date: new Date(),
      supplier: selectedSupplier,
      products: selectedProducts,
      total: purchaseTotal,
      profit: 0,
      // For purchases, profit is 0 as it's a cost
      type: 'purchase' as const,
      paymentMethod: 'cash' as const
    };
    const success = addTransaction(transaction);
    if (success) {
      toast.success("Pembelian berhasil!", {
        duration: 1000
      });
      resetForm();
    } else {
      toast.error("Pembelian gagal!", {
        duration: 1000
      });
      setIsProcessing(false);
    }
  };

  const purchaseTotal = selectedProducts.reduce((total, item) => total + item.quantity * item.price, 0);

  const ProductCard = ({
    product
  }: {
    product: Product;
  }) => {
    const defaultImage = "https://placehold.co/300x150?text=Produk";
    return <Card className="overflow-hidden card-hover h-full flex flex-col cursor-pointer" onClick={() => handleAddProduct(product)}>
        <div className="h-auto overflow-hidden flex items-center justify-center px-0 py-0 my-0 mx-0">
          <AspectRatio ratio={1 / 1} className="w-full">
            <img src={product.image || defaultImage} alt={product.name} onError={e => (e.target as HTMLImageElement).src = defaultImage} className="w-full h-full object-cover" />
          </AspectRatio>
        </div>
        <div className="p-2 flex-grow px-[10px] py-[10px]">
          <div className="flex justify-between items-start">
            <div className="w-full">
              <h3 className="font-medium text-xs">{product.name}</h3>
              <p className="text-xs text-muted-foreground">
                {product.sku} • {product.stock} stok
              </p>
              <p className="text-sm font-semibold">Rp{product.supplierPrice.toLocaleString('id-ID')}</p>
            </div>
          </div>
        </div>
      </Card>;
  };

  const handleClearCartAndReturn = () => {
    setSelectedProducts([]);
    setShowCheckout(false);
    toast.success("Daftar pembelian dikosongkan", {
      duration: 1000
    });
  };

  const shouldShowCartIcon = selectedProducts.length > 0 && !showCheckout;

  const renderSelectedSupplier = () => {
    if (!selectedSupplier) return null;
    return (
      <div className="flex items-center gap-2 px-2 py-1 bg-accent rounded-md text-sm">
        <span className="font-medium">Supplier: {selectedSupplier.name}</span>
      </div>
    );
  };

  return <div className="container animate-slide-up py-[10px] px-[2px]">
      <div className="flex justify-between items-center mb-6">
        {showCheckout && <Button variant="ghost" size="icon" onClick={() => setShowCheckout(false)} className="mr-4">
            <ChevronsLeft size={24} />
          </Button>}
        
        <div className="w-full text-center">
          <h2 className="text-3xl font-bold tracking-tight text-left">Pembelian</h2>
          <p className="text-muted-foreground text-left">Proses pembelian produk dari supplier</p>
        </div>
        
        {selectedProducts.length > 0 && <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={handleClearCartAndReturn}>
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
            
            {!selectedSupplier ? (
              <Select onValueChange={value => setSelectedSupplier(suppliers.find(s => s.id === value) || null)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Pilih supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map(supplier => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              renderSelectedSupplier()
            )}
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 px-0 mx-0 my-0 py-0">
            {filteredProducts.map(product => <ProductCard key={product.id} product={product} />)}
          </div>
          
          {filteredProducts.length === 0 && <div className="text-center py-10">
              <p className="text-muted-foreground">Tidak ada produk yang cocok dengan pencarian Anda.</p>
            </div>}
        </> : <div className="animate-slide-up grid gap-6 md:grid-cols-5">
          <div className="md:col-span-3">
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-accent p-3 border-b flex justify-between items-center">
                <h3 className="font-medium">Item Pembelian</h3>
                {selectedSupplier && <span className="text-sm">Supplier: {selectedSupplier.name}</span>}
              </div>
              
              <div className="divide-y">
                {selectedProducts.map(item => <div key={item.product.id} className="p-4 flex justify-between items-center">
                    <div className="flex-1">
                      {item.product.image && <div className="w-10 h-10 rounded mr-3 overflow-hidden float-left">
                          <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" onError={e => (e.target as HTMLImageElement).src = "https://placehold.co/300x150?text=Produk"} />
                        </div>}
                      <div>
                        <h4 className="font-medium">{item.product.name}</h4>
                        <div className="flex flex-col sm:flex-row sm:gap-4">
                          <div className="mt-1 sm:mt-0">
                            <Label htmlFor={`price-${item.product.id}`} className="text-xs text-muted-foreground">Harga</Label>
                            <CurrencyInput id={`price-${item.product.id}`} placeholder="Harga" initialValue={item.price.toString()} onChange={val => handleUpdatePrice(item.product.id, val)} className="h-8 text-sm" />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div>
                        <Label htmlFor={`quantity-${item.product.id}`} className="sr-only">Jumlah</Label>
                        <Input type="number" id={`quantity-${item.product.id}`} placeholder="0" value={item.quantity} onChange={e => {
                    const value = parseInt(e.target.value);
                    if (!isNaN(value) && value > 0) {
                      handleUpdateQuantity(item.product.id, value);
                    }
                  }} className="w-16 h-8 text-sm" />
                      </div>
                      
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => handleRemoveProduct(item.product.id)}>
                        <X size={18} />
                      </Button>
                    </div>
                  </div>)}
                
                {selectedProducts.length === 0 && <div className="text-center py-8">
                    <p className="text-muted-foreground">Belum ada produk yang dipilih</p>
                  </div>}
              </div>
            </div>
          </div>
          
          <div className="md:col-span-2">
            <PurchaseCheckoutForm purchaseTotal={purchaseTotal} currentCapital={currentCapital} onCheckout={handleCheckout} isProcessing={isProcessing} />
          </div>
        </div>}
      
      {shouldShowCartIcon && <Button className="fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-lg bg-primary text-white hover:bg-primary/90 transition-all" onClick={() => setShowCheckout(true)}>
          <div className="relative">
            <ShoppingCart size={24} />
            <span className="absolute -top-2 -right-2 bg-white text-primary rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold px-0 py-[3px] my-[-5px] mx-[-5px]">
              {selectedProducts.length}
            </span>
          </div>
        </Button>}
    </div>;
};

export default Purchases;
