
import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Settings as SettingsIcon, 
  Save, 
  Store, 
  User, 
  CreditCard, 
  FileText,
  Shield
} from 'lucide-react';
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

const Settings = () => {
  return (
    <div className="animate-slide-up">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground">Configure your application preferences</p>
        </div>
      </div>
      
      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="grid grid-cols-5 md:w-[600px]">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="business">Business</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="receipts">Receipts</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile">
          <Card className="p-6">
            <ProfileSettings />
          </Card>
        </TabsContent>
        
        <TabsContent value="business">
          <Card className="p-6">
            <BusinessSettings />
          </Card>
        </TabsContent>
        
        <TabsContent value="payments">
          <Card className="p-6">
            <PaymentSettings />
          </Card>
        </TabsContent>
        
        <TabsContent value="receipts">
          <Card className="p-6">
            <ReceiptSettings />
          </Card>
        </TabsContent>
        
        <TabsContent value="security">
          <Card className="p-6">
            <SecuritySettings />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Profile Settings Component
const profileFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  phone: z.string().optional(),
});

function ProfileSettings() {
  const form = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: "Store Admin",
      email: "admin@example.com",
      phone: "",
    },
  });

  function onSubmit(values: z.infer<typeof profileFormSchema>) {
    toast.success("Profile updated successfully!");
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium flex items-center gap-2">
          <User size={18} className="text-primary" />
          User Profile
        </h3>
        <p className="text-sm text-muted-foreground">
          Update your personal information and contact details.
        </p>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="Your name" {...field} />
                </FormControl>
                <FormDescription>
                  This is your display name in the system.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="your.email@example.com" {...field} />
                </FormControl>
                <FormDescription>
                  Used for notifications and password recovery.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input placeholder="(555) 555-5555" {...field} />
                </FormControl>
                <FormDescription>
                  Optional: For urgent communications.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button type="submit" className="mt-4 bg-primary text-white flex items-center gap-2">
            <Save size={16} />
            Save Changes
          </Button>
        </form>
      </Form>
    </div>
  );
}

// Business Settings Component
const businessFormSchema = z.object({
  businessName: z.string().min(2, {
    message: "Business name must be at least 2 characters.",
  }),
  address: z.string().min(5, {
    message: "Address must be at least 5 characters.",
  }),
  taxId: z.string().optional(),
  currency: z.string(),
});

function BusinessSettings() {
  const form = useForm<z.infer<typeof businessFormSchema>>({
    resolver: zodResolver(businessFormSchema),
    defaultValues: {
      businessName: "Dropship Store",
      address: "123 Main St, Anytown, USA",
      taxId: "",
      currency: "USD",
    },
  });

  function onSubmit(values: z.infer<typeof businessFormSchema>) {
    toast.success("Business information updated successfully!");
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium flex items-center gap-2">
          <Store size={18} className="text-primary" />
          Business Information
        </h3>
        <p className="text-sm text-muted-foreground">
          Configure your business details used on receipts and reports.
        </p>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="businessName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Business Name</FormLabel>
                <FormControl>
                  <Input placeholder="Your Business Name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Business Address</FormLabel>
                <FormControl>
                  <Input placeholder="123 Main St, City, Country" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="taxId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tax ID / Business Number</FormLabel>
                <FormControl>
                  <Input placeholder="Optional Tax ID" {...field} />
                </FormControl>
                <FormDescription>
                  Used for tax reporting purposes.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Currency</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a currency" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="USD">USD - US Dollar</SelectItem>
                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                    <SelectItem value="GBP">GBP - British Pound</SelectItem>
                    <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                    <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  The currency used for all transactions.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button type="submit" className="mt-4 bg-primary text-white flex items-center gap-2">
            <Save size={16} />
            Save Changes
          </Button>
        </form>
      </Form>
    </div>
  );
}

// Payment Settings Component
function PaymentSettings() {
  const [cashEnabled, setCashEnabled] = useState(true);
  const [cardEnabled, setCardEnabled] = useState(true);
  const [digitalEnabled, setDigitalEnabled] = useState(false);
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium flex items-center gap-2">
          <CreditCard size={18} className="text-primary" />
          Payment Methods
        </h3>
        <p className="text-sm text-muted-foreground">
          Configure which payment methods are available for sales.
        </p>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between space-x-2">
          <div className="flex-1 space-y-1">
            <p className="font-medium">Cash Payments</p>
            <p className="text-sm text-muted-foreground">
              Accept cash payments for in-person sales.
            </p>
          </div>
          <Switch
            checked={cashEnabled}
            onCheckedChange={setCashEnabled}
          />
        </div>
        
        <div className="flex items-center justify-between space-x-2">
          <div className="flex-1 space-y-1">
            <p className="font-medium">Card Payments</p>
            <p className="text-sm text-muted-foreground">
              Accept credit and debit card payments.
            </p>
          </div>
          <Switch
            checked={cardEnabled}
            onCheckedChange={setCardEnabled}
          />
        </div>
        
        <div className="flex items-center justify-between space-x-2">
          <div className="flex-1 space-y-1">
            <p className="font-medium">Digital Payments</p>
            <p className="text-sm text-muted-foreground">
              Accept digital wallets and mobile payments.
            </p>
          </div>
          <Switch
            checked={digitalEnabled}
            onCheckedChange={setDigitalEnabled}
          />
        </div>
      </div>
      
      <Button className="mt-4 bg-primary text-white flex items-center gap-2" onClick={() => toast.success("Payment settings saved!")}>
        <Save size={16} />
        Save Payment Settings
      </Button>
    </div>
  );
}

// Receipt Settings Component
function ReceiptSettings() {
  const [showLogo, setShowLogo] = useState(true);
  const [showTaxInfo, setShowTaxInfo] = useState(true);
  const [showCustomMessage, setShowCustomMessage] = useState(false);
  const [customMessage, setCustomMessage] = useState("Thank you for your business!");
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium flex items-center gap-2">
          <FileText size={18} className="text-primary" />
          Receipt Customization
        </h3>
        <p className="text-sm text-muted-foreground">
          Customize how receipts are formatted and what information they include.
        </p>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between space-x-2">
          <div className="flex-1 space-y-1">
            <p className="font-medium">Show Business Logo</p>
            <p className="text-sm text-muted-foreground">
              Display your business logo at the top of receipts.
            </p>
          </div>
          <Switch
            checked={showLogo}
            onCheckedChange={setShowLogo}
          />
        </div>
        
        <div className="flex items-center justify-between space-x-2">
          <div className="flex-1 space-y-1">
            <p className="font-medium">Include Tax Information</p>
            <p className="text-sm text-muted-foreground">
              Show tax breakdown and business tax ID on receipts.
            </p>
          </div>
          <Switch
            checked={showTaxInfo}
            onCheckedChange={setShowTaxInfo}
          />
        </div>
        
        <div className="flex items-center justify-between space-x-2">
          <div className="flex-1 space-y-1">
            <p className="font-medium">Custom Thank You Message</p>
            <p className="text-sm text-muted-foreground">
              Add a personalized message at the bottom of receipts.
            </p>
          </div>
          <Switch
            checked={showCustomMessage}
            onCheckedChange={setShowCustomMessage}
          />
        </div>
        
        {showCustomMessage && (
          <div className="pt-2">
            <Input
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Enter your custom message"
              className="w-full"
            />
            <p className="text-xs text-muted-foreground mt-1">
              This message will appear at the bottom of all receipts.
            </p>
          </div>
        )}
      </div>
      
      <Button className="mt-4 bg-primary text-white flex items-center gap-2" onClick={() => toast.success("Receipt settings saved!")}>
        <Save size={16} />
        Save Receipt Settings
      </Button>
    </div>
  );
}

// Security Settings Component
function SecuritySettings() {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [requirePasswordReset, setRequirePasswordReset] = useState(false);
  const [activityLogging, setActivityLogging] = useState(true);
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium flex items-center gap-2">
          <Shield size={18} className="text-primary" />
          Security Settings
        </h3>
        <p className="text-sm text-muted-foreground">
          Configure security options for your account and the application.
        </p>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between space-x-2">
          <div className="flex-1 space-y-1">
            <p className="font-medium">Two-Factor Authentication</p>
            <p className="text-sm text-muted-foreground">
              Add an extra layer of security to your account.
            </p>
          </div>
          <Switch
            checked={twoFactorEnabled}
            onCheckedChange={setTwoFactorEnabled}
          />
        </div>
        
        <div className="flex items-center justify-between space-x-2">
          <div className="flex-1 space-y-1">
            <p className="font-medium">Periodic Password Reset</p>
            <p className="text-sm text-muted-foreground">
              Require password changes every 90 days.
            </p>
          </div>
          <Switch
            checked={requirePasswordReset}
            onCheckedChange={setRequirePasswordReset}
          />
        </div>
        
        <div className="flex items-center justify-between space-x-2">
          <div className="flex-1 space-y-1">
            <p className="font-medium">Activity Logging</p>
            <p className="text-sm text-muted-foreground">
              Keep a log of all actions performed in the system.
            </p>
          </div>
          <Switch
            checked={activityLogging}
            onCheckedChange={setActivityLogging}
          />
        </div>
      </div>
      
      <div className="pt-4">
        <Button className="bg-primary text-white flex items-center gap-2" onClick={() => toast.success("Security settings saved!")}>
          <Save size={16} />
          Save Security Settings
        </Button>
        
        <Button variant="outline" className="ml-4">
          Change Password
        </Button>
      </div>
    </div>
  );
}

export default Settings;
