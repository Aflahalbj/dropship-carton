
import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

interface CartItemPriceEditorProps {
  productId: string;
  originalPrice: number;
  discountedPrice?: number;
  onPriceChange: (productId: string, newPrice: number) => void;
}

const CartItemPriceEditor: React.FC<CartItemPriceEditorProps> = ({
  productId,
  originalPrice,
  discountedPrice,
  onPriceChange
}) => {
  const [isEnabled, setIsEnabled] = useState<boolean>(!!discountedPrice && discountedPrice !== originalPrice);
  const [price, setPrice] = useState<string>(
    (discountedPrice || originalPrice).toString()
  );
  
  const handleToggleChange = (checked: boolean) => {
    setIsEnabled(checked);
    
    if (!checked) {
      // Reset to original price when disabled
      onPriceChange(productId, originalPrice);
    }
  };
  
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    setPrice(value);
  };
  
  const handlePriceBlur = () => {
    if (isEnabled && price) {
      const numericValue = parseInt(price, 10);
      onPriceChange(productId, numericValue);
    }
  };
  
  return (
    <div className="mt-2 pl-2">
      <div className="flex items-center space-x-2 mb-1">
        <Checkbox 
          id={`enable-price-change-${productId}`}
          checked={isEnabled}
          onCheckedChange={handleToggleChange}
        />
        <label 
          htmlFor={`enable-price-change-${productId}`}
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Ubah harga sementara
        </label>
      </div>
      
      {isEnabled && (
        <div className="flex items-center mt-1">
          <span className="text-sm text-muted-foreground mr-2">Rp</span>
          <Input
            type="text"
            className="w-32 h-8 text-sm"
            value={price}
            onChange={handlePriceChange}
            onBlur={handlePriceBlur}
          />
        </div>
      )}
    </div>
  );
};

export default CartItemPriceEditor;
