
import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { useAppContext, Product } from "@/context/AppContext";
import { Input } from "@/components/ui/input";
import { Search, ArrowUpDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useAppContext();
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
            <p className="text-sm text-muted-foreground mb-1">
              {product.sku} • {product.stock} stok
            </p>
            <p className="text-lg font-semibold">Rp{product.price.toLocaleString('id-ID')}</p>
          </div>
        </div>
      </div>
    </Card>
  );
}

const POS: React.FC = () => {
  const { products } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<string>("name-asc");

  const filteredProducts = products
    .filter(product => 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      product.sku.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
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

  return (
    <div className="container mx-auto p-4 animate-slide-up">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Point of Sale</h1>
      </div>

      <div className="mb-6 flex flex-wrap gap-4">
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
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filteredProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-10">
          <p className="text-muted-foreground">Tidak ada produk yang cocok dengan pencarian Anda.</p>
        </div>
      )}
    </div>
  );
};

export default POS;
