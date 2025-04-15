
import React from 'react';
import { Button } from "@/components/ui/button";
import { Check } from 'lucide-react';
import { toast } from 'sonner';
import { useFormValidation } from '@/utils/form-helpers';

interface PurchaseCheckoutFormProps {
  purchaseTotal: number;
  currentCapital: number;
  onCheckout: () => void;
  isProcessing: boolean;
}

export const PurchaseCheckoutForm: React.FC<PurchaseCheckoutFormProps> = ({
  purchaseTotal,
  currentCapital,
  onCheckout,
  isProcessing
}) => {
  const { validateForm } = useFormValidation();
  
  const handleSubmit = () => {
    if (purchaseTotal > currentCapital) {
      toast.error(`Modal tidak mencukupi untuk pembelian ini! Modal saat ini: Rp${currentCapital.toLocaleString('id-ID')}, Total pembelian: Rp${purchaseTotal.toLocaleString('id-ID')}`);
      return;
    }
    
    onCheckout();
  };
  
  const insufficientFunds = purchaseTotal > currentCapital;
  
  return (
    <div className="bg-card border rounded-lg p-5">
      <div className="space-y-3 mb-6">
        <div className="flex justify-between text-lg font-semibold">
          <span>Total Pembelian:</span>
          <span>Rp{purchaseTotal.toLocaleString('id-ID')}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Modal Saat Ini:</span>
          <span className="font-medium">Rp{currentCapital.toLocaleString('id-ID')}</span>
        </div>
        {insufficientFunds && (
          <div className="text-destructive text-sm mt-2">
            Modal tidak mencukupi untuk pembelian ini!
          </div>
        )}
      </div>
      
      <div className="flex gap-4">
        <Button 
          variant="outline" 
          className="flex-1" 
          onClick={() => onCheckout()}
          disabled={isProcessing}
        >
          Kosongkan Keranjang
        </Button>
        <Button 
          className="flex-1 bg-primary text-white flex items-center justify-center gap-2"
          onClick={handleSubmit}
          disabled={isProcessing || insufficientFunds}
        >
          <Check size={18} />
          Selesaikan Pembelian
        </Button>
      </div>
    </div>
  );
};
