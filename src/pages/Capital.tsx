
import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { DollarSign, TrendingDown, TrendingUp } from 'lucide-react';

const formSchema = z.object({
  amount: z.string().min(1, {
    message: "Jumlah wajib diisi.",
  }),
});

const Capital = () => {
  const { capital, addToCapital, subtractFromCapital } = useAppContext();
  const [operation, setOperation] = useState<'add' | 'subtract'>('add');
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: "",
    },
  });
  
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const amount = parseFloat(values.amount);
    
    if (isNaN(amount) || amount <= 0) {
      toast.error("Masukkan jumlah yang valid");
      return;
    }
    
    if (operation === 'add') {
      addToCapital(amount);
      toast.success(`Rp${amount.toLocaleString('id-ID')} ditambahkan ke modal`);
    } else {
      const success = subtractFromCapital(amount);
      if (success) {
        toast.success(`Rp${amount.toLocaleString('id-ID')} dikurangi dari modal`);
      }
    }
    
    form.reset();
  };
  
  return (
    <div className="animate-slide-up">
      <h2 className="text-3xl font-bold tracking-tight mb-6">Modal Bisnis</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="bg-card shadow-sm">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Total Modal</p>
                <h3 className="text-2xl font-bold">Rp{capital.toLocaleString('id-ID')}</h3>
              </div>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="bg-card border rounded-lg p-6 w-full max-w-md mx-auto">
        <h3 className="text-lg font-medium mb-6">Kelola Modal</h3>
        
        <div className="flex gap-4 mb-6">
          <Button
            type="button"
            variant={operation === 'add' ? "default" : "outline"}
            className="flex-1 gap-2"
            onClick={() => setOperation('add')}
          >
            <TrendingUp size={16} />
            Tambah
          </Button>
          <Button
            type="button"
            variant={operation === 'subtract' ? "default" : "outline"}
            className="flex-1 gap-2"
            onClick={() => setOperation('subtract')}
          >
            <TrendingDown size={16} />
            Kurangi
          </Button>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jumlah (Rp)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Contoh: 500000" 
                      {...field} 
                      type="number"
                      min="0"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              className="w-full"
            >
              {operation === 'add' ? 'Tambah ke Modal' : 'Kurangi dari Modal'}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default Capital;
