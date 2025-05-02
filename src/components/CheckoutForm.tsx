
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from '@/components/FormInputs';

interface CheckoutFormData {
  customerName?: string;
  paymentMethod: string;
  cashAmount?: number;
  changeAmount?: number;
  modifiedCart?: any[];
}

interface CheckoutFormProps {
  cartTotal: number;
  cartProfit: number;
  onSubmit: (data: CheckoutFormData) => void;
  isProcessing: boolean;
}

export const CheckoutForm: React.FC<CheckoutFormProps> = ({ 
  cartTotal, 
  cartProfit,
  onSubmit,
  isProcessing = false
}) => {
  const [customerName, setCustomerName] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [cashAmount, setCashAmount] = useState<number | undefined>(undefined);
  const [changeAmount, setChangeAmount] = useState<number>(0);
  
  // Calculate change whenever cash value or payment method changes
  useEffect(() => {
    if (paymentMethod === 'cash' && typeof cashAmount === 'number') {
      const change = cashAmount - cartTotal;
      setChangeAmount(change >= 0 ? change : 0);
    } else {
      setChangeAmount(0);
    }
  }, [cashAmount, cartTotal, paymentMethod]);

  const handleExactAmount = () => {
    // Set the cash amount to exactly match the cart total
    setCashAmount(cartTotal);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (paymentMethod === 'cash' && (!cashAmount || cashAmount < cartTotal)) {
      return; // Don't submit if cash amount is insufficient
    }
    
    onSubmit({
      customerName: customerName || undefined,
      paymentMethod,
      cashAmount,
      changeAmount: paymentMethod === 'cash' ? changeAmount : undefined
    });
  };

  return (
    <form onSubmit={handleSubmit} className="border rounded-lg p-6 bg-card">
      <h3 className="font-medium text-lg mb-4">Checkout</h3>
      
      <div className="space-y-4">
        <div>
          <Input
            placeholder="Nama Pelanggan (Opsional)"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />
        </div>
        
        <div>
          <div className="flex justify-between mb-1">
            <span>Total Belanja</span>
            <span className="font-medium">Rp{cartTotal.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground text-sm">Profit</span>
            <span className="text-muted-foreground text-sm">Rp{cartProfit.toLocaleString('id-ID')}</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <span className="text-sm font-medium">Metode Pembayaran</span>
          <RadioGroup 
            defaultValue="cash" 
            value={paymentMethod}
            onValueChange={setPaymentMethod}
            className="flex flex-col space-y-1"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="cash" id="cash" />
              <Label htmlFor="cash">Tunai</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="transfer" id="transfer" />
              <Label htmlFor="transfer">Transfer</Label>
            </div>
          </RadioGroup>
        </div>
        
        {paymentMethod === 'cash' && (
          <>
            <div className="space-y-1">
              <Label htmlFor="cash-amount">Jumlah Uang Tunai</Label>
              <div className="flex gap-2">
                <CurrencyInput
                  id="cash-amount"
                  value={cashAmount}
                  onChange={(value) => setCashAmount(value)}
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
          </>
        )}
      </div>
      
      <Button 
        type="submit" 
        className="w-full mt-6" 
        disabled={isProcessing || (paymentMethod === 'cash' && (!cashAmount || cashAmount < cartTotal))}
      >
        {isProcessing ? "Memproses..." : "Proses Pembayaran"}
      </Button>
    </form>
  );
};
