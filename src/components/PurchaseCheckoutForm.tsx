
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { CurrencyInput } from '@/components/FormInputs';
import { useAppContext } from "@/context/AppContext";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

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
  const [cashValue, setCashValue] = useState<number | undefined>(undefined);
  const [changeAmount, setChangeAmount] = useState<number>(0);
  
  // Calculate change whenever cash value changes
  useEffect(() => {
    if (typeof cashValue === 'number') {
      const change = cashValue - purchaseTotal;
      setChangeAmount(change >= 0 ? change : 0);
    } else {
      setChangeAmount(0);
    }
  }, [cashValue, purchaseTotal]);

  const handleExactAmount = () => {
    // Set the cash value to exactly match the purchase total
    setCashValue(purchaseTotal);
  };

  const handleCheckout = () => {
    if (!cashValue || cashValue < purchaseTotal) {
      toast.error("Jumlah uang tunai harus mencukupi total pembayaran", {
        duration: 3000
      });
      return;
    }
    
    if (purchaseTotal > currentCapital) {
      toast.error("Modal tidak mencukupi untuk pembelian ini", {
        duration: 3000
      });
      return;
    }
    
    onCheckout();
  };

  return (
    <div className="border rounded-lg p-6 bg-card">
      <h3 className="font-medium text-lg mb-4">Pembayaran</h3>
      
      <div className="space-y-4">
        <div>
          <div className="flex justify-between mb-1">
            <Label htmlFor="total">Total Pembayaran</Label>
            <span className="font-medium">Rp{purchaseTotal.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between mb-1">
            <Label htmlFor="capital">Modal Tersedia</Label>
            <span className="font-medium">Rp{currentCapital.toLocaleString('id-ID')}</span>
          </div>
        </div>
        
        <div className="space-y-1">
          <Label htmlFor="cash-amount">Jumlah Uang Tunai</Label>
          <div className="flex gap-2">
            <CurrencyInput
              id="cash-amount"
              value={cashValue}
              onChange={(value) => setCashValue(value)}
              placeholder="0"
              className="flex-1"
            />
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleExactAmount}
              className="whitespace-nowrap"
            >
              Uang Pas
            </Button>
          </div>
        </div>
        
        <div className="flex justify-between items-center pt-2">
          <Label>Kembalian:</Label>
          <span className="text-lg font-medium">
            Rp{changeAmount.toLocaleString('id-ID')}
          </span>
        </div>
      </div>
      
      <Button 
        className="w-full mt-6" 
        disabled={isProcessing || !cashValue || cashValue < purchaseTotal || purchaseTotal > currentCapital}
        onClick={handleCheckout}
      >
        {isProcessing ? "Memproses..." : "Proses Pembelian"}
      </Button>
    </div>
  );
};

export default PurchaseCheckoutForm;
