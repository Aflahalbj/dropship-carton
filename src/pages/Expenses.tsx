import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar as CalendarIcon, FileText, Filter, Plus, Trash, Search } from 'lucide-react';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const EXPENSE_CATEGORIES = ['Sewa', 'Utilitas', 'Gaji', 'Pemasaran', 'Perlengkapan', 'Pengiriman', 'Asuransi', 'Pajak', 'Perangkat Lunak', 'Lain-lain'];

const formSchema = z.object({
  amount: z.string().min(1, "Jumlah wajib diisi").refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: "Jumlah harus angka positif"
  }),
  category: z.string().min(1, "Kategori wajib diisi"),
  description: z.string().min(1, "Deskripsi wajib diisi"),
  date: z.date({
    required_error: "Tanggal wajib diisi"
  })
});

const Expenses = () => {
  const {
    expenses,
    addExpense,
    isAuthenticated
  } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: '',
      category: '',
      description: '',
      date: new Date()
    },
    mode: 'onSubmit'
  });

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = !searchTerm || expense.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || expense.category === categoryFilter;
    return matchesSearch && matchesCategory;
  }).map(expense => ({
    ...expense,
    date: expense.date instanceof Date ? expense.date : new Date(expense.date)
  })).sort((a, b) => {
    return b.date.getTime() - a.date.getTime();
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);

      const amount = parseFloat(values.amount);
      const newExpense = {
        date: values.date,
        amount,
        category: values.category,
        description: values.description
      };

      const success = await addExpense(newExpense);
      if (success) {
        form.reset();
        toast.success("Pengeluaran berhasil dicatat");
      }
    } catch (error) {
      console.error("Error submitting expense:", error);
      toast.error("Gagal mencatat pengeluaran");
    } finally {
      setIsSubmitting(false);
    }
  };

  const expensesByCategory = EXPENSE_CATEGORIES.map(category => {
    const total = expenses.filter(e => e.category === category).reduce((sum, e) => sum + e.amount, 0);
    return {
      category,
      total
    };
  }).filter(item => item.total > 0).sort((a, b) => b.total - a.total);

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  return <div className="animate-slide-up">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Pengeluaran</h2>
          <p className="text-muted-foreground">Pantau dan kelola pengeluaran</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="col-span-1 md:col-span-2">
          <Card className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="amount" render={({
                  field
                }) => <FormItem>
                        <FormLabel>Jumlah</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">Rp</span>
                            <Input placeholder="0" className="pl-8" {...field} onChange={e => field.onChange(e.target.value)} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>} />
                  
                  <FormField control={form.control} name="category" render={({
                  field
                }) => <FormItem>
                        <FormLabel>Kategori</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih kategori" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {EXPENSE_CATEGORIES.map(category => <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>} />
                </div>
                
                <FormField control={form.control} name="description" render={({
                field
              }) => <FormItem>
                      <FormLabel>Deskripsi</FormLabel>
                      <FormControl>
                        <Input placeholder="Masukkan deskripsi pengeluaran" {...field} onChange={e => field.onChange(e.target.value)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>} />
                
                <FormField control={form.control} name="date" render={({
                field
              }) => <FormItem className="flex flex-col">
                      <FormLabel>Tanggal</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                              {field.value ? format(field.value, "PPP") : <span>Pilih tanggal</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus className="pointer-events-auto" />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>} />
                
                <Button type="submit" className="w-full bg-primary text-white" disabled={isSubmitting}>
                  {isSubmitting ? "Menyimpan..." : "Catat Pengeluaran"}
                </Button>
              </form>
            </Form>
          </Card>
        </div>
        
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Ringkasan Pengeluaran</h3>
          <div className="space-y-4">
            <div className="flex justify-between border-b pb-4">
              <span className="text-muted-foreground">Total Pengeluaran</span>
              <span className="font-bold">Rp{totalExpenses.toLocaleString('id-ID')}</span>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Kategori Teratas</h4>
              {expensesByCategory.slice(0, 5).map((item, i) => <div key={item.category} className="flex justify-between text-sm">
                  <span>{item.category}</span>
                  <span>Rp{item.total.toLocaleString('id-ID')}</span>
                </div>)}
            </div>
          </div>
        </Card>
      </div>
      
      <div className="bg-card border rounded-lg overflow-hidden">
        <div className="p-4 bg-accent border-b">
          <h3 className="font-medium mb-3">Riwayat Pengeluaran</h3>
          
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-2"
              onClick={() => setCategoryFilter(categoryFilter === 'all' ? EXPENSE_CATEGORIES[0] : 'all')}
            >
              <Filter size={16} />
              {categoryFilter === 'all' ? 'Semua Kategori' : categoryFilter}
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-2"
              onClick={() => {
                setSearchTerm(searchTerm ? '' : 'Cari pengeluaran...');
              }}
            >
              <Search size={16} />
              {searchTerm ? 'Hapus Pencarian' : 'Cari'}
            </Button>
          </div>
        </div>
        
        <div className="divide-y">
          {filteredExpenses.length > 0 ? filteredExpenses.map(expense => <div key={expense.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <FileText size={18} />
                  </div>
                  <div>
                    <p className="font-medium">{expense.description}</p>
                    <div className="flex items-center text-xs text-muted-foreground gap-2">
                      <span>{format(expense.date, "d MMMM yyyy")}</span>
                      <span className="bg-accent rounded-full px-2 py-0.5">
                        {expense.category}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-medium text-red-600">-Rp{expense.amount.toLocaleString('id-ID')}</span>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                    <Trash size={16} />
                  </Button>
                </div>
              </div>) : <div className="p-8 text-center">
              <FileText size={48} className="mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Tidak ada pengeluaran ditemukan</h3>
              <p className="text-muted-foreground mb-4">
                {categoryFilter !== 'all' ? `Tidak ada pengeluaran dalam kategori '${categoryFilter}'.` : 'Tidak ada pengeluaran yang cocok dengan pencarian Anda.'}
              </p>
              <Button variant="outline" onClick={() => {
            setSearchTerm('');
            setCategoryFilter('all');
          }}>
                Hapus Filter
              </Button>
            </div>}
        </div>
      </div>
    </div>;
};

export default Expenses;
