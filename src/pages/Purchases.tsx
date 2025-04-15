import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAppContext, Product, Supplier } from "@/context/AppContext";
import { Plus, X, Check } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CurrencyInput } from '@/components/FormInputs';
import { PurchaseCheckoutForm } from '@/components/PurchaseCheckoutForm';

const Purchases: React.FC = () => {
  const {
    products,
    suppliers,
    addTransaction,
    currentCapital
  } = useAppContext();
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<
    { product: Product; quantity: number; price: number }[]
  >([]);
  const [newProduct, setNewProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [price, setPrice] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer'>('cash');
  const [showCheckout, setShowCheckout] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (products.length > 0) {
      setNewProduct(products[0]);
    }
  }, [products]);

  const handleAddProduct = () => {
    if (newProduct) {
      const existingProductIndex = selectedProducts.findIndex(
        (item) => item.product.id === newProduct.id
      );

      if (existingProductIndex > -1) {
        const updatedProducts = [...selectedProducts];
        updatedProducts[existingProductIndex].quantity += quantity;
        updatedProducts[existingProductIndex].price = price;
        setSelectedProducts(updatedProducts);
      } else {
        setSelectedProducts([
          ...selectedProducts,
          { product: newProduct, quantity: quantity, price: price },
        ]);
      }
    }
  };

  const handleRemoveProduct = (productId: string) => {
    setSelectedProducts(selectedProducts.filter((item) => item.product.id !== productId));
  };

  const resetForm = () => {
    setSelectedSupplier(null);
    setSelectedProducts([]);
    setNewProduct(products[0]);
    setQuantity(1);
    setPrice(0);
    setPaymentMethod('cash');
    setIsProcessing(false);
  };

  const handleCheckout = () => {
    if (selectedSupplier && selectedProducts.length > 0) {
      setIsProcessing(true);
      const transaction = {
        date: new Date(),
        supplier: selectedSupplier,
        products: selectedProducts,
        total: selectedProducts.reduce((total, item) => total + (item.quantity * item.price), 0),
        type: 'purchase' as const,
        paymentMethod
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
      }
    } else {
      toast.error("Lengkapi data pembelian", {
        duration: 1000
      });
    }
  };

  const purchaseTotal = selectedProducts.reduce((total, item) => total + (item.quantity * item.price), 0);

  return <div className="container animate-slide-up py-10">
      <h2 className="text-3xl font-bold tracking-tight">Pembelian</h2>
      <p className="text-muted-foreground">Proses pembelian produk dari supplier</p>
      
      <div className="grid md:grid-cols-2 gap-6 mt-8">
        <div>
          <Card className="p-5">
            <h3 className="font-medium text-lg mb-4">Informasi Supplier</h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="supplier">Pilih Supplier</Label>
                <Select onValueChange={(value) => setSelectedSupplier(suppliers.find(s => s.id === value) || null)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih supplier" defaultValue={selectedSupplier?.id} />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedSupplier && <div className="p-3 rounded-md bg-muted">
                  <h4 className="font-semibold">Detail Supplier</h4>
                  <p>Nama: {selectedSupplier.name}</p>
                  <p>Telepon: {selectedSupplier.phone}</p>
                  <p>Alamat: {selectedSupplier.address}</p>
                </div>}
            </div>
          </Card>
          
          <Card className="p-5 mt-6">
            <h3 className="font-medium text-lg mb-4">Pilih Produk</h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="product">Pilih Produk</Label>
                <Select onValueChange={(value) => setNewProduct(products.find(p => p.id === value) || null)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih produk" defaultValue={newProduct?.id} />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="quantity">Jumlah</Label>
                  <Input 
                    type="number" 
                    id="quantity" 
                    value={quantity} 
                    onChange={(e) => setQuantity(Number(e.target.value))} 
                    min="1" 
                    className="w-full" 
                  />
                </div>
                
                <div>
                  <Label htmlFor="price">Harga</Label>
                  <CurrencyInput 
                    id="price" 
                    placeholder="Harga" 
                    onChange={setPrice} 
                  />
                </div>
                
                <Button onClick={handleAddProduct} className="bg-primary text-white mt-6 flex items-center justify-center gap-2">
                  <Plus size={16} />
                  Tambah Produk
                </Button>
              </div>
            </div>
          </Card>
        </div>
        
        <div>
          <Card className="p-5">
            <h3 className="font-medium text-lg mb-4">Daftar Produk</h3>
            
            {selectedProducts.length === 0 ? <div className="text-center py-10">
                <p className="text-muted-foreground">Tidak ada produk yang dipilih.</p>
              </div> : <div className="space-y-3">
                {selectedProducts.map((item) => (
                  <div key={item.product.id} className="flex justify-between items-center p-3 rounded-md bg-muted">
                    <div>
                      <h4 className="font-medium">{item.product.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {item.quantity} x Rp{item.price.toLocaleString('id-ID')} = Rp{(item.quantity * item.price).toLocaleString('id-ID')}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => handleRemoveProduct(item.product.id)}>
                      <X size={18} />
                    </Button>
                  </div>
                ))}
                
                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total:</span>
                    <span>Rp{purchaseTotal.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              </div>}
          </Card>
        </div>
      </div>
      
      <div className="mt-8">
        <PurchaseCheckoutForm 
          purchaseTotal={purchaseTotal}
          currentCapital={currentCapital}
          onCheckout={handleCheckout}
          isProcessing={isProcessing}
        />
      </div>
    </div>;
};

export default Purchases;
