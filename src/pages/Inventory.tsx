import React, { useState } from 'react';
import { useAppContext, Product } from '../context/AppContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Plus, Search, Edit, Trash, X, Check, Image, Link, ArrowUpDown } from 'lucide-react';
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Inventory = () => {
  const { products, addProduct, updateProduct, deleteProduct } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    price: '',
    supplierPrice: '',
    stock: '',
    image: '',
  });
  
  const [imageSource, setImageSource] = useState<'url' | 'file'>('url');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  
  const [sortOrder, setSortOrder] = useState<string>("name-asc");
  
  const filteredProducts = products
    .filter(product => 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      product.sku.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
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
        case "profit-asc":
          return (a.price - a.supplierPrice) - (b.price - b.supplierPrice);
        case "profit-desc":
          return (b.price - b.supplierPrice) - (a.price - a.supplierPrice);
        default:
          return 0;
      }
    });
  
  const resetForm = () => {
    setFormData({
      name: '',
      sku: '',
      price: '',
      supplierPrice: '',
      stock: '',
      image: '',
    });
    setImageSource('url');
    setImageFile(null);
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
        image: product.image || '',
      });
      setImageSource(product.image?.startsWith('data:') ? 'file' : 'url');
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
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
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
    
    if (!editingProduct && products.some(p => p.sku === formData.sku)) {
      toast.error("SKU sudah ada");
      return;
    }
    
    let imageUrl = formData.image || "https://placehold.co/300x150?text=Produk";
    
    const productData = {
      name: formData.name,
      sku: formData.sku,
      price,
      supplierPrice,
      stock,
      image: imageUrl,
    };
    
    if (editingProduct) {
      updateProduct({
        ...productData,
        id: editingProduct.id,
      });
    } else {
      addProduct(productData);
    }
    
    handleCloseForm();
  };
  
  const confirmDeleteProduct = (id: string) => {
    setProductToDelete(id);
    setIsDeleteDialogOpen(true);
  };
  
  const handleDeleteProduct = () => {
    if (productToDelete) {
      deleteProduct(productToDelete);
      setIsDeleteDialogOpen(false);
      setProductToDelete(null);
      toast.success("Produk berhasil dihapus");
    }
  };
  
  return (
    <div className="animate-slide-up">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Manajemen Inventaris</h2>
          <p className="text-muted-foreground">Kelola katalog produk dan tingkat stok Anda</p>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row md:items-end gap-4 mb-6">
        <div className="flex-grow relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            type="text"
            placeholder="Cari produk berdasarkan nama atau SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="w-full md:w-48">
          <Select value={sortOrder} onValueChange={setSortOrder}>
            <SelectTrigger className="w-full justify-center">
              <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name-asc">Nama (A-Z)</SelectItem>
              <SelectItem value="name-desc">Nama (Z-A)</SelectItem>
              <SelectItem value="price-asc">Harga Jual (Terendah-Tertinggi)</SelectItem>
              <SelectItem value="price-desc">Harga Jual (Tertinggi-Terendah)</SelectItem>
              <SelectItem value="stock-asc">Stok (Terendah-Tertinggi)</SelectItem>
              <SelectItem value="stock-desc">Stok (Tertinggi-Terendah)</SelectItem>
              <SelectItem value="profit-asc">Keuntungan (Terendah-Tertinggi)</SelectItem>
              <SelectItem value="profit-desc">Keuntungan (Tertinggi-Terendah)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button 
          variant="outline"
          size="icon"
          className="w-10 h-10"
          onClick={() => handleOpenForm()}
        >
          <Plus size={20} />
        </Button>
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
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded bg-accent overflow-hidden flex-shrink-0">
                        <img 
                          src={product.image || "https://placehold.co/300x150?text=Produk"} 
                          alt={product.name} 
                          className="w-full h-full object-cover"
                          onError={(e) => (e.target as HTMLImageElement).src = "https://placehold.co/300x150?text=Produk"}
                        />
                      </div>
                      <span>{product.name}</span>
                    </div>
                  </td>
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
                        onClick={() => confirmDeleteProduct(product.id)}
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
      
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <div className="p-4">
            <h3 className="text-xl font-semibold mb-4">Konfirmasi Hapus Produk</h3>
            <p className="mb-6">Apakah Anda yakin ingin menghapus produk ini? Tindakan ini tidak dapat dibatalkan.</p>
            
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                Batal
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteProduct}
              >
                Hapus Produk
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <Card className="max-w-lg w-full relative animate-slide-up max-h-[90vh] overflow-y-auto">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-10"
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
                      type="text"
                      placeholder="0"
                      value={formData.price}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^\d]/g, '');
                        setFormData(prev => ({ ...prev, price: value }));
                      }}
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
                      type="text"
                      placeholder="0"
                      value={formData.supplierPrice}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^\d]/g, '');
                        setFormData(prev => ({ ...prev, supplierPrice: value }));
                      }}
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="stock" className="block text-sm font-medium text-muted-foreground mb-1">
                    Stok
                  </label>
                  <Input
                    id="stock"
                    name="stock"
                    type="text"
                    placeholder="0"
                    value={formData.stock}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^\d]/g, '');
                      setFormData(prev => ({ ...prev, stock: value }));
                    }}
                    className="w-full h-10"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Foto Produk
                  </label>
                  
                  <div className="flex gap-2 mb-3">
                    <Button 
                      type="button"
                      variant={imageSource === 'url' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setImageSource('url')}
                      className="flex items-center gap-1"
                    >
                      <Link size={14} />
                      URL
                    </Button>
                    <Button 
                      type="button"
                      variant={imageSource === 'file' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setImageSource('file')}
                      className="flex items-center gap-1"
                    >
                      <Image size={14} />
                      Upload
                    </Button>
                  </div>
                  
                  {imageSource === 'url' ? (
                    <Input
                      name="image"
                      placeholder="https://example.com/image.jpg"
                      value={formData.image}
                      onChange={handleInputChange}
                    />
                  ) : (
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="text-sm"
                    />
                  )}
                  
                  {formData.image ? (
                    <div className="mt-3 border rounded overflow-hidden w-24 h-24">
                      <img 
                        src={formData.image} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                        onError={(e) => (e.target as HTMLImageElement).src = 'https://placehold.co/100x100?text=Error'} 
                      />
                    </div>
                  ) : (
                    <div className="mt-3 border rounded overflow-hidden w-24 h-24">
                      <img 
                        src="https://placehold.co/300x150?text=Produk" 
                        alt="Default" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
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
