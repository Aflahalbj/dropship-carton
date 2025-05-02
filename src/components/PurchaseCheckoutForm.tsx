import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from '@/components/FormInputs';
import { useAppContext } from "@/context/AppContext";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Check, Banknote, CreditCard } from 'lucide-react';
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
  const [supplierName, setSupplierName] = useState<string>('');
  const [supplierPhone, setSupplierPhone] = useState<string>('');
  const [supplierAddress, setSupplierAddress] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer'>('cash');
  const [cashValue, setCashValue] = useState<number | undefined>(undefined);
  const [changeAmount, setChangeAmount] = useState<number>(0);

  // Calculate change whenever cash value changes
  useEffect(() => {
    if (paymentMethod === 'cash' && typeof cashValue === 'number') {
      const change = cashValue - purchaseTotal;
      setChangeAmount(change >= 0 ? change : 0);
    } else {
      setChangeAmount(0);
    }
  }, [cashValue, purchaseTotal, paymentMethod]);
  const handleExactAmount = () => {
    // Set the cash value to exactly match the purchase total
    setCashValue(purchaseTotal);
  };

  // Quick amount buttons
  const quickAmounts = [1000000, 5000000, 10000000, 20000000];
  const handleQuickAmount = (amount: number) => {
    setCashValue(amount);
  };
  const handleCheckout = () => {
    if (paymentMethod === 'cash' && (!cashValue || cashValue < purchaseTotal)) {
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
  return <div className="border rounded-lg p-6 bg-card">
      <h3 className="font-medium text-lg mb-4">Informasi Supplier</h3>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="supplierName">Nama Supplier (Opsional)</Label>
          <Input id="supplierName" placeholder="Nama supplier" value={supplierName} onChange={e => setSupplierName(e.target.value)} className="mt-1" />
        </div>
        
        <div>
          <Label htmlFor="supplierPhone">Nomor Telepon (Opsional)</Label>
          <Input id="supplierPhone" placeholder="Nomor telepon supplier" value={supplierPhone} onChange={e => setSupplierPhone(e.target.value)} className="mt-1" />
        </div>
        
        <div>
          <Label htmlFor="supplierAddress">Alamat (Opsional)</Label>
          <Input id="supplierAddress" placeholder="Alamat supplier" value={supplierAddress} onChange={e => setSupplierAddress(e.target.value)} className="mt-1" />
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
                <CurrencyInput id="cash-amount" initialValue={cashValue?.toString()} onChange={value => setCashValue(value)} placeholder="Masukkan jumlah uang" className="w-full" />
              </div>
            </div>
            
            
            
            <Button type="button" variant="outline" onClick={handleExactAmount} className="w-full">
              Uang Pas: {purchaseTotal.toLocaleString('id-ID')}
            </Button>
            
            <div className="flex justify-between items-center pt-2">
              <Label>Kembalian:</Label>
              <span className="text-lg font-medium">
                Rp{changeAmount.toLocaleString('id-ID')}
              </span>
            </div>
          </>}
        
        <div className="flex justify-between items-center text-lg font-bold pt-2">
          <span>Total Pembelian:</span>
          <span>Rp{purchaseTotal.toLocaleString('id-ID')}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Modal Saat Ini:</span>
          <span className="font-medium">Rp{currentCapital.toLocaleString('id-ID')}</span>
        </div>
      </div>
      
      <Button className="w-full mt-6 py-6" disabled={isProcessing || paymentMethod === 'cash' && (!cashValue || cashValue < purchaseTotal) || purchaseTotal > currentCapital} onClick={handleCheckout}>
        {isProcessing ? "Memproses..." : <>
            <Check className="mr-2" size={20} />
            Selesaikan Pembelian
          </>}
      </Button>
    </div>;
};
export default PurchaseCheckoutForm;