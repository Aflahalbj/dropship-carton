
import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar as CalendarIcon, FileText, Filter, Plus, Trash, Filter as FilterIcon, Search } from 'lucide-react';
import { toast } from "sonner";

// Define expense categories
const EXPENSE_CATEGORIES = [
  'Rent',
  'Utilities',
  'Payroll',
  'Marketing',
  'Supplies',
  'Shipping',
  'Insurance',
  'Taxes',
  'Software',
  'Miscellaneous',
];

// Create form schema
const formSchema = z.object({
  amount: z.string().min(1, "Amount is required").refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
    { message: "Amount must be a positive number" }
  ),
  category: z.string().min(1, "Category is required"),
  description: z.string().min(1, "Description is required"),
  date: z.date({
    required_error: "Date is required",
  }),
});

const Expenses = () => {
  const { expenses, addExpense } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  
  // Set up form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: '',
      category: '',
      description: '',
      date: new Date(),
    },
  });
  
  // Filter expenses
  const filteredExpenses = expenses.filter(expense => {
    // Filter by search term
    const matchesSearch = !searchTerm || 
      expense.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filter by category
    const matchesCategory = !categoryFilter || expense.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  }).sort((a, b) => b.date.getTime() - a.date.getTime()); // Sort by date descending

  // Form submission
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const amount = parseFloat(values.amount);
    
    const newExpense = {
      date: values.date,
      amount,
      category: values.category,
      description: values.description,
    };
    
    const success = addExpense(newExpense);
    
    if (success) {
      form.reset();
    }
  };
  
  // Calculate totals by category
  const expensesByCategory = EXPENSE_CATEGORIES.map(category => {
    const total = expenses
      .filter(e => e.category === category)
      .reduce((sum, e) => sum + e.amount, 0);
    
    return { category, total };
  }).filter(item => item.total > 0).sort((a, b) => b.total - a.total);
  
  // Calculate total expenses
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  
  return (
    <div className="animate-slide-up">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Expense Tracking</h2>
          <p className="text-muted-foreground">Monitor and manage your business expenses</p>
        </div>
        
        <Button 
          onClick={() => form.reset()}
          className="bg-primary text-white flex items-center gap-2"
        >
          <Plus size={18} />
          Add Expense
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="col-span-1 md:col-span-2">
          <Card className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                            <Input 
                              placeholder="0.00" 
                              className="pl-8" 
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {EXPENSE_CATEGORIES.map(category => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter expense description" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full bg-primary text-white"
                >
                  Record Expense
                </Button>
              </form>
            </Form>
          </Card>
        </div>
        
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Expense Summary</h3>
          <div className="space-y-4">
            <div className="flex justify-between border-b pb-4">
              <span className="text-muted-foreground">Total Expenses</span>
              <span className="font-bold">${totalExpenses.toFixed(2)}</span>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Top Categories</h4>
              {expensesByCategory.slice(0, 5).map((item, i) => (
                <div key={item.category} className="flex justify-between text-sm">
                  <span>{item.category}</span>
                  <span>${item.total.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
      
      {/* Expenses List */}
      <div className="bg-card border rounded-lg overflow-hidden">
        <div className="p-4 bg-accent border-b flex justify-between items-center">
          <h3 className="font-medium">Expense History</h3>
          
          <div className="flex items-center gap-2">
            <div className="relative">
              <FilterIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px] pl-9">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Categories</SelectItem>
                  {EXPENSE_CATEGORIES.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
              <Input
                type="text"
                placeholder="Search expenses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-[180px] pl-9"
              />
            </div>
          </div>
        </div>
        
        <div className="divide-y">
          {filteredExpenses.length > 0 ? (
            filteredExpenses.map((expense) => (
              <div key={expense.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <FileText size={18} />
                  </div>
                  <div>
                    <p className="font-medium">{expense.description}</p>
                    <div className="flex items-center text-xs text-muted-foreground gap-2">
                      <span>{format(new Date(expense.date), "MMMM d, yyyy")}</span>
                      <span className="bg-accent rounded-full px-2 py-0.5">
                        {expense.category}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-medium text-red-600">-${expense.amount.toFixed(2)}</span>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                    <Trash size={16} />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center">
              <FileText size={48} className="mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No expenses found</h3>
              <p className="text-muted-foreground mb-4">
                {categoryFilter ? `No expenses in the '${categoryFilter}' category.` : 'No expenses match your search.'}
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setCategoryFilter('');
                }}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Expenses;
