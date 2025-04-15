
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
