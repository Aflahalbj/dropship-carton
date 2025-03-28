
import React, { useState } from 'react';
import { useAppContext, Product } from '../context/AppContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Plus, Package, Search, Edit, Trash, X, Check } from 'lucide-react';
import { toast } from "sonner";

const Inventory = () => {
  const { products, addProduct, updateProduct, deleteProduct } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    price: '',
    supplierPrice: '',
    stock: '',
  });
  
  // Filter products based on search term
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const resetForm = () => {
    setFormData({
      name: '',
      sku: '',
      price: '',
      supplierPrice: '',
      stock: '',
    });
    setEditingProduct(null);
  };
  
  const handleOpenForm = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        sku: product.sku,
        price: product.price.toString(),
        supplierPrice: product.supplierPrice.toString(),
        stock: product.stock.toString(),
      });
    } else {
      resetForm();
    }
    setShowForm(true);
  };
  
  const handleCloseForm = () => {
    setShowForm(false);
    resetForm();
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.name || !formData.sku) {
      toast.error("Nama dan SKU harus diisi");
      return;
    }
    
    const price = parseFloat(formData.price);
    const supplierPrice = parseFloat(formData.supplierPrice);
    const stock = parseInt(formData.stock);
    
    if (isNaN(price) || price <= 0) {
      toast.error("Masukkan harga jual yang valid");
      return;
    }
    
    if (isNaN(supplierPrice) || supplierPrice <= 0) {
      toast.error("Masukkan harga supplier yang valid");
      return;
    }
    
    if (isNaN(stock) || stock < 0) {
      toast.error("Masukkan jumlah stok yang valid");
      return;
    }
    
    if (supplierPrice >= price) {
      toast.error("Harga supplier harus lebih rendah dari harga jual");
      return;
    }
    
    // Check if SKU already exists (for new products)
    if (!editingProduct && products.some(p => p.sku === formData.sku)) {
      toast.error("SKU sudah ada");
      return;
    }
    
    const productData = {
      name: formData.name,
      sku: formData.sku,
      price,
      supplierPrice,
      stock,
    };
    
    if (editingProduct) {
      updateProduct({
        ...productData,
        id: editingProduct.id,
        image: editingProduct.image,
      });
    } else {
      addProduct(productData);
    }
    
    handleCloseForm();
  };
  
  const handleDeleteProduct = (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus produk ini?")) {
      deleteProduct(id);
    }
  };
  
  return (
    <div className="animate-slide-up">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Manajemen Inventaris</h2>
          <p className="text-muted-foreground">Kelola katalog produk dan tingkat stok Anda</p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            className="bg-primary text-white flex items-center gap-2"
            onClick={() => handleOpenForm()}
          >
            <Plus size={18} />
            Tambah Produk
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Total Produk</p>
            <p className="text-2xl font-bold">{products.length}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Package size={24} className="text-primary" />
          </div>
        </Card>
        
        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Stok Habis</p>
            <p className="text-2xl font-bold">
              {products.filter(p => p.stock === 0).length}
            </p>
          </div>
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
            <Package size={24} className="text-red-500" />
          </div>
        </Card>
        
        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Stok Rendah</p>
            <p className="text-2xl font-bold">
              {products.filter(p => p.stock > 0 && p.stock <= 5).length}
            </p>
          </div>
          <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center">
            <Package size={24} className="text-amber-500" />
          </div>
        </Card>
        
        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Stok Tersedia</p>
            <p className="text-2xl font-bold">
              {products.filter(p => p.stock > 5).length}
            </p>
          </div>
          <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
            <Package size={24} className="text-green-500" />
          </div>
        </Card>
      </div>
      
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
      
      <div className="bg-card border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-accent">
                <th className="text-left py-3 px-4 font-medium">Produk</th>
                <th className="text-left py-3 px-4 font-medium">SKU</th>
                <th className="text-right py-3 px-4 font-medium">Harga Jual</th>
                <th className="text-right py-3 px-4 font-medium">Harga Supplier</th>
                <th className="text-right py-3 px-4 font-medium">Keuntungan</th>
                <th className="text-right py-3 px-4 font-medium">Stok</th>
                <th className="text-right py-3 px-4 font-medium">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-accent/30 transition-colors">
                  <td className="py-3 px-4">{product.name}</td>
                  <td className="py-3 px-4 text-muted-foreground">{product.sku}</td>
                  <td className="py-3 px-4 text-right">Rp{product.price.toLocaleString('id-ID')}</td>
                  <td className="py-3 px-4 text-right">Rp{product.supplierPrice.toLocaleString('id-ID')}</td>
                  <td className="py-3 px-4 text-right text-primary">
                    Rp{(product.price - product.supplierPrice).toLocaleString('id-ID')}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${
                      product.stock === 0 
                        ? 'bg-red-50 text-red-600'
                        : product.stock <= 5
                          ? 'bg-amber-50 text-amber-600'
                          : 'bg-green-50 text-green-600'
                    }`}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        onClick={() => handleOpenForm(product)}
                      >
                        <Edit size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDeleteProduct(product.id)}
                      >
                        <Trash size={16} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-muted-foreground">
                    Tidak ada produk ditemukan
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Product Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-lg w-full relative animate-slide-up">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4"
              onClick={handleCloseForm}
            >
              <X size={20} />
            </Button>
            
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-4">
                {editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-muted-foreground mb-1">
                    Nama Produk
                  </label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Masukkan nama produk"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="sku" className="block text-sm font-medium text-muted-foreground mb-1">
                    SKU
                  </label>
                  <Input
                    id="sku"
                    name="sku"
                    placeholder="Masukkan SKU produk"
                    value={formData.sku}
                    onChange={handleInputChange}
                    readOnly={!!editingProduct}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="price" className="block text-sm font-medium text-muted-foreground mb-1">
                      Harga Jual
                    </label>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      step="0.01"
                      placeholder="0"
                      value={formData.price}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="supplierPrice" className="block text-sm font-medium text-muted-foreground mb-1">
                      Harga Supplier
                    </label>
                    <Input
                      id="supplierPrice"
                      name="supplierPrice"
                      type="number"
                      step="0.01"
                      placeholder="0"
                      value={formData.supplierPrice}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="stock" className="block text-sm font-medium text-muted-foreground mb-1">
                    Stok Awal
                  </label>
                  <Input
                    id="stock"
                    name="stock"
                    type="number"
                    placeholder="0"
                    value={formData.stock}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseForm}
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    className="bg-primary text-white flex items-center gap-2"
                  >
                    <Check size={18} />
                    {editingProduct ? 'Perbarui Produk' : 'Tambah Produk'}
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Inventory;
