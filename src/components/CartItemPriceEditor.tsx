
import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

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
  const [price, setPrice] = useState<string>((discountedPrice || originalPrice).toString());

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
    <div className="flex flex-col space-y-1 mt-1">
      <div className="flex items-center space-x-2">
        <Checkbox 
          id={`enable-price-change-${productId}`} 
          checked={isEnabled} 
          onCheckedChange={handleToggleChange}
          className="mr-2"
        />
        <Label 
          htmlFor={`enable-price-change-${productId}`} 
          className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Ubah harga sementara
        </Label>
      </div>
      
      {isEnabled && (
        <div className="flex items-center ml-6">
          <span className="text-sm text-muted-foreground mr-1">Rp</span>
          <Input 
            type="text" 
            className="w-24 h-7 text-sm" 
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
