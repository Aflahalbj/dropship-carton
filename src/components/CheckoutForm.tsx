import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { Label } from "@/components/ui/label";
import { CurrencyInput } from '@/components/FormInputs';
import { Check, Banknote, CreditCard } from 'lucide-react';
export interface CheckoutFormData {
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  paymentMethod: 'cash' | 'transfer';
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
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerAddress, setCustomerAddress] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer'>('cash');
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

  // Quick amount buttons
  const quickAmounts = [1000000, 5000000, 10000000, 20000000];
  const handleQuickAmount = (amount: number) => {
    setCashAmount(amount);
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentMethod === 'cash' && (!cashAmount || cashAmount < cartTotal)) {
      return; // Don't submit if cash amount is insufficient
    }
    onSubmit({
      customerName: customerName || undefined,
      customerPhone: customerPhone || undefined,
      customerAddress: customerAddress || undefined,
      paymentMethod,
      cashAmount,
      changeAmount: paymentMethod === 'cash' ? changeAmount : undefined
    });
  };
  return <form onSubmit={handleSubmit} className="border rounded-lg p-6 bg-card">
      <h3 className="font-medium text-lg mb-4">Informasi Pelanggan</h3>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="customerName">Nama Pelanggan (Opsional)</Label>
          <Input id="customerName" placeholder="Nama pelanggan" value={customerName} onChange={e => setCustomerName(e.target.value)} className="mt-1" />
        </div>
        
        <div>
          <Label htmlFor="customerPhone">Nomor Telepon (Opsional)</Label>
          <Input id="customerPhone" placeholder="Nomor telepon pelanggan" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} className="mt-1" />
        </div>
        
        <div>
          <Label htmlFor="customerAddress">Alamat (Opsional)</Label>
          <Input id="customerAddress" placeholder="Alamat pelanggan" value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} className="mt-1" />
        </div>
        
        <div className="space-y-2">
          <Label>Metode Pembayaran</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant={paymentMethod === 'cash' ? 'default' : 'outline'} onClick={() => setPaymentMethod('cash')} className="justify-center py-6">
              <Banknote className="mr-2" size={20} />
              Tunai
            </Button>
            <Button type="button" variant={paymentMethod === 'transfer' ? 'default' : 'outline'} onClick={() => setPaymentMethod('transfer')} className="justify-center py-6">
              <CreditCard className="mr-2" size={20} />
              Transfer
            </Button>
          </div>
        </div>
        
        {paymentMethod === 'cash' && <>
            <div className="space-y-1">
              <Label htmlFor="cash-amount">Jumlah Uang Tunai</Label>
              <div className="relative">
                <CurrencyInput id="cash-amount" initialValue={cashAmount?.toString()} onChange={value => setCashAmount(value)} placeholder="Masukkan jumlah uang" className="w-full" />
              </div>
            </div>
            
            
            
            <Button type="button" variant="outline" onClick={handleExactAmount} className="w-full">
              Uang Pas: {cartTotal.toLocaleString('id-ID')}
            </Button>
            
            <div className="flex justify-between items-center pt-2">
              <Label>Kembalian:</Label>
              <span className="text-lg font-medium">
                Rp{changeAmount.toLocaleString('id-ID')}
              </span>
            </div>
          </>}
      </div>
      
      <div className="mt-6 space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Subtotal:</span>
          <span className="font-medium">Rp{cartTotal.toLocaleString('id-ID')}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Estimasi Profit:</span>
          <span className="text-blue-500 font-medium">Rp{cartProfit.toLocaleString('id-ID')}</span>
        </div>
        
        <div className="flex justify-between items-center text-lg font-bold">
          <span>Total:</span>
          <span>Rp{cartTotal.toLocaleString('id-ID')}</span>
        </div>
      </div>
      
      <Button type="submit" className="w-full mt-4 py-6" disabled={isProcessing || paymentMethod === 'cash' && (!cashAmount || cashAmount < cartTotal)}>
        {isProcessing ? "Memproses..." : <>
            <Check className="mr-2" size={20} />
            Selesaikan Penjualan
          </>}
      </Button>
    </form>;
};