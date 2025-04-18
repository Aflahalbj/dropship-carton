
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CurrencyInput, TextInput } from './FormInputs';
import { useFormValidation } from '@/utils/form-helpers';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, CreditCard, Wallet, Phone, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { useAppContext } from '@/context/AppContext';

interface CheckoutFormProps {
  cartTotal: number;
  cartProfit: number;
  onSubmit: (formData: CheckoutFormData) => void;
  isProcessing: boolean;
}

export interface CheckoutFormData {
  customerName: string;
  customerPhone: string; // Added customer phone
  customerAddress: string; // Added customer address
  paymentMethod: 'cash' | 'transfer';
  cashAmount: number;
  changeAmount: number; // Added changeAmount property
  modifiedCart?: any[]; 
}

export const CheckoutForm: React.FC<CheckoutFormProps> = ({
  cartTotal,
  cartProfit,
  onSubmit,
  isProcessing
}) => {
  // Form state
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>(''); // New state for customer phone
  const [customerAddress, setCustomerAddress] = useState<string>(''); // New state for customer address
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer'>('cash');
  const [cashAmount, setCashAmount] = useState<number>(0);

  // Form validation
  const {
    errors,
    setErrors,
    validateForm
  } = useFormValidation();

  // Calculated values
  const changeAmount = paymentMethod === 'cash' ? Math.max(0, cashAmount - cartTotal) : 0;
  const handleSubmit = () => {
    // Validate form fields
    const fieldsToValidate: Record<string, any> = {
      cashAmount: paymentMethod === 'cash' ? cashAmount : true
    };
    const isValid = validateForm(fieldsToValidate);

    // Additional validation for cash payment
    if (paymentMethod === 'cash' && cashAmount < cartTotal) {
      setErrors(prev => ({
        ...prev,
        cashAmount: 'Jumlah uang tunai tidak mencukupi'
      }));
      return;
    }
    if (isValid) {
      onSubmit({
        customerName,
        customerPhone,
        customerAddress,
        paymentMethod,
        cashAmount,
        changeAmount // Pass the calculated changeAmount
      });
    } else {
      toast.error('Mohon lengkapi semua field yang diperlukan', {
        duration: 1000
      });
    }
  };
  const handleQuickAmount = (amount: number) => {
    setCashAmount(amount);
  };
  const setExactAmount = () => {
    setCashAmount(cartTotal);
  };
  return <Card className="p-5">
      <h3 className="font-medium text-lg mb-4">Informasi Pelanggan</h3>
      
      <div className="space-y-4">
        <TextInput 
          id="customerName" 
          label="Nama Pelanggan (Opsional)" 
          placeholder="Nama pelanggan" 
          onChange={setCustomerName} 
          error={errors.customerName} 
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextInput 
            id="customerPhone" 
            label="Nomor Telepon (Opsional)" 
            placeholder="Nomor telepon pelanggan" 
            onChange={setCustomerPhone}
            error={errors.customerPhone}
          />
          
          <TextInput 
            id="customerAddress" 
            label="Alamat (Opsional)" 
            placeholder="Alamat pelanggan" 
            onChange={setCustomerAddress}
            error={errors.customerAddress}
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
              <CurrencyInput id="cashAmount" label="Jumlah Uang Tunai" placeholder="Masukkan jumlah uang" onChange={setCashAmount} error={errors.cashAmount} />
              
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
                  Uang Pas: {cartTotal.toLocaleString('id-ID')}
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
        
        <div className="space-y-3 pt-4 border-t">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal:</span>
            <span>Rp{cartTotal.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between font-medium">
            <span className="text-muted-foreground">Estimasi Profit:</span>
            <span className="text-primary">Rp{cartProfit.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between text-lg font-semibold">
            <span>Total:</span>
            <span>Rp{cartTotal.toLocaleString('id-ID')}</span>
          </div>
        </div>
        
        <Button className="w-full bg-primary text-white flex items-center justify-center gap-2 mt-4" onClick={handleSubmit} disabled={isProcessing || paymentMethod === 'cash' && cashAmount < cartTotal}>
          <Check size={18} />
          Selesaikan Penjualan
        </Button>
      </div>
    </Card>;
};
