import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Check, CreditCard, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { useFormValidation } from '@/utils/form-helpers';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CurrencyInput, TextInput } from './FormInputs';
import { Input } from "@/components/ui/input";

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
  const [cashAmount, setCashAmount] = useState<number>(0);

  const {
    errors,
    setErrors,
    validateForm
  } = useFormValidation();

  const handleSubmit = () => {
    if (purchaseTotal > currentCapital) {
      toast.error(`Modal tidak mencukupi untuk pembelian ini! Modal saat ini: Rp${currentCapital.toLocaleString('id-ID')}, Total pembelian: Rp${purchaseTotal.toLocaleString('id-ID')}`);
      return;
    }
    
    if (paymentMethod === 'cash' && cashAmount < purchaseTotal) {
      setErrors(prev => ({
        ...prev,
        cashAmount: 'Jumlah uang tunai tidak mencukupi'
      }));
      return;
    }
    
    onCheckout();
  };
  
  const handleQuickAmount = (amount: number) => {
    setCashAmount(amount);
  };
  
  const setExactAmount = () => {
    setCashAmount(purchaseTotal);
  };

  const insufficientFunds = purchaseTotal > currentCapital;
  const changeAmount = paymentMethod === 'cash' ? Math.max(0, cashAmount - purchaseTotal) : 0;

  return <div className="bg-card border rounded-lg p-5">
      <h3 className="font-medium text-lg mb-4">Informasi Supplier</h3>
      
      <div className="space-y-4 mb-6">
        <TextInput 
          id="supplierName" 
          label="Nama Supplier (Opsional)" 
          placeholder="Nama supplier" 
          onChange={setSupplierName} 
          error={errors.supplierName} 
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              Nomor Telepon (Opsional)
            </label>
            <Input 
              type="tel" 
              placeholder="Nomor telepon supplier" 
              value={supplierPhone}
              onChange={(e) => setSupplierPhone(e.target.value)}
              pattern="[0-9]*"
              className=""
            />
          </div>
          
          <TextInput 
            id="supplierAddress" 
            label="Alamat (Opsional)" 
            placeholder="Alamat supplier" 
            onChange={setSupplierAddress}
            error={errors.supplierAddress}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">
            Metode Pembayaran
          </label>
          <Tabs defaultValue="cash" className="w-full" value={paymentMethod} onValueChange={v => setPaymentMethod(v as 'cash' | 'transfer')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="cash" className="flex items-center gap-1">
                <Wallet size={16} />
                Tunai
              </TabsTrigger>
              <TabsTrigger value="transfer" className="flex items-center gap-1">
                <CreditCard size={16} />
                Transfer
              </TabsTrigger>
            </TabsList>
            <TabsContent value="cash" className="space-y-4 mt-2">
              <CurrencyInput 
                id="cashAmount" 
                label="Jumlah Uang Tunai" 
                placeholder="Masukkan jumlah uang" 
                onChange={setCashAmount} 
                error={errors.cashAmount} 
              />
              
              <div className="grid grid-cols-4 gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => handleQuickAmount(1000000)} className="text-xs">
                  1.000.000
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => handleQuickAmount(5000000)} className="text-xs">
                  5.000.000
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => handleQuickAmount(10000000)} className="text-xs">
                  10.000.000
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => handleQuickAmount(20000000)} className="text-xs">
                  20.000.000
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={setExactAmount} className="col-span-4 mt-1 text-xs">
                  Uang Pas: {purchaseTotal.toLocaleString('id-ID')}
                </Button>
              </div>
              
              {cashAmount > 0 && <div className="pt-2 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Kembalian:</span>
                    <span className="font-medium">
                      Rp{changeAmount.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>}
            </TabsContent>
            <TabsContent value="transfer" className="space-y-4 mt-2">
              <div className="p-2 bg-accent rounded-md text-sm">
                Pembayaran akan dilakukan melalui transfer bank
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      <div className="space-y-3 mb-6">
        <div className="flex justify-between text-lg font-semibold">
          <span>Total Pembelian:</span>
          <span>Rp{purchaseTotal.toLocaleString('id-ID')}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Modal Saat Ini:</span>
          <span className="font-medium">Rp{currentCapital.toLocaleString('id-ID')}</span>
        </div>
        {insufficientFunds && <div className="text-destructive text-sm mt-2">
            Modal tidak mencukupi untuk pembelian ini!
          </div>}
      </div>
      
      <div className="flex gap-4">
        <Button 
          className="flex-1 bg-primary text-white flex items-center justify-center gap-2" 
          onClick={handleSubmit} 
          disabled={isProcessing || insufficientFunds || (paymentMethod === 'cash' && cashAmount < purchaseTotal)}
        >
          <Check size={18} />
          Selesaikan Pembelian
        </Button>
      </div>
    </div>;
};
