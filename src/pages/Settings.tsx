
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
          <h2 className="text-3xl font-bold tracking-tight">Pengaturan</h2>
          <p className="text-muted-foreground">Konfigurasi preferensi aplikasi Anda</p>
        </div>
      </div>
      
      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="grid grid-cols-5 md:w-[600px]">
          <TabsTrigger value="profile">Profil</TabsTrigger>
          <TabsTrigger value="business">Bisnis</TabsTrigger>
          <TabsTrigger value="payments">Pembayaran</TabsTrigger>
          <TabsTrigger value="receipts">Struk</TabsTrigger>
          <TabsTrigger value="security">Keamanan</TabsTrigger>
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
    message: "Nama harus minimal 2 karakter.",
  }),
  email: z.string().email({
    message: "Silakan masukkan alamat email yang valid.",
  }),
  phone: z.string().optional(),
});

function ProfileSettings() {
  const form = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: "Admin Toko",
      email: "admin@example.com",
      phone: "",
    },
  });

  function onSubmit(values: z.infer<typeof profileFormSchema>) {
    toast.success("Profil berhasil diperbarui!");
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium flex items-center gap-2">
          <User size={18} className="text-primary" />
          Profil Pengguna
        </h3>
        <p className="text-sm text-muted-foreground">
          Perbarui informasi pribadi dan detail kontak Anda.
        </p>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nama Lengkap</FormLabel>
                <FormControl>
                  <Input placeholder="Nama Anda" {...field} />
                </FormControl>
                <FormDescription>
                  Ini adalah nama tampilan Anda di sistem.
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
                  <Input placeholder="email.anda@example.com" {...field} />
                </FormControl>
                <FormDescription>
                  Digunakan untuk notifikasi dan pemulihan kata sandi.
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
                <FormLabel>Nomor Telepon</FormLabel>
                <FormControl>
                  <Input placeholder="(555) 555-5555" {...field} />
                </FormControl>
                <FormDescription>
                  Opsional: Untuk komunikasi darurat.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button type="submit" className="mt-4 bg-primary text-white flex items-center gap-2">
            <Save size={16} />
            Simpan Perubahan
          </Button>
        </form>
      </Form>
    </div>
  );
}

// Business Settings Component
const businessFormSchema = z.object({
  businessName: z.string().min(2, {
    message: "Nama bisnis harus minimal 2 karakter.",
  }),
  address: z.string().min(5, {
    message: "Alamat harus minimal 5 karakter.",
  }),
  taxId: z.string().optional(),
  currency: z.string(),
});

function BusinessSettings() {
  const form = useForm<z.infer<typeof businessFormSchema>>({
    resolver: zodResolver(businessFormSchema),
    defaultValues: {
      businessName: "Toko Dropship",
      address: "Jl. Utama No. 123, Jakarta, Indonesia",
      taxId: "",
      currency: "IDR",
    },
  });

  function onSubmit(values: z.infer<typeof businessFormSchema>) {
    toast.success("Informasi bisnis berhasil diperbarui!");
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium flex items-center gap-2">
          <Store size={18} className="text-primary" />
          Informasi Bisnis
        </h3>
        <p className="text-sm text-muted-foreground">
          Konfigurasi detail bisnis Anda yang digunakan pada struk dan laporan.
        </p>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="businessName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nama Bisnis</FormLabel>
                <FormControl>
                  <Input placeholder="Nama Bisnis Anda" {...field} />
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
                <FormLabel>Alamat Bisnis</FormLabel>
                <FormControl>
                  <Input placeholder="Jl. Utama No. 123, Kota, Negara" {...field} />
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
                <FormLabel>NPWP / Nomor Bisnis</FormLabel>
                <FormControl>
                  <Input placeholder="NPWP Opsional" {...field} />
                </FormControl>
                <FormDescription>
                  Digunakan untuk tujuan pelaporan pajak.
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
                <FormLabel>Mata Uang</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih mata uang" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="IDR">IDR - Rupiah Indonesia</SelectItem>
                    <SelectItem value="USD">USD - Dolar AS</SelectItem>
                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                    <SelectItem value="SGD">SGD - Dolar Singapura</SelectItem>
                    <SelectItem value="MYR">MYR - Ringgit Malaysia</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Mata uang yang digunakan untuk semua transaksi.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button type="submit" className="mt-4 bg-primary text-white flex items-center gap-2">
            <Save size={16} />
            Simpan Perubahan
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
          Metode Pembayaran
        </h3>
        <p className="text-sm text-muted-foreground">
          Konfigurasi metode pembayaran yang tersedia untuk penjualan.
        </p>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between space-x-2">
          <div className="flex-1 space-y-1">
            <p className="font-medium">Pembayaran Tunai</p>
            <p className="text-sm text-muted-foreground">
              Terima pembayaran tunai untuk penjualan langsung.
            </p>
          </div>
          <Switch
            checked={cashEnabled}
            onCheckedChange={setCashEnabled}
          />
        </div>
        
        <div className="flex items-center justify-between space-x-2">
          <div className="flex-1 space-y-1">
            <p className="font-medium">Pembayaran Kartu</p>
            <p className="text-sm text-muted-foreground">
              Terima pembayaran kartu kredit dan debit.
            </p>
          </div>
          <Switch
            checked={cardEnabled}
            onCheckedChange={setCardEnabled}
          />
        </div>
        
        <div className="flex items-center justify-between space-x-2">
          <div className="flex-1 space-y-1">
            <p className="font-medium">Pembayaran Digital</p>
            <p className="text-sm text-muted-foreground">
              Terima dompet digital dan pembayaran mobile.
            </p>
          </div>
          <Switch
            checked={digitalEnabled}
            onCheckedChange={setDigitalEnabled}
          />
        </div>
      </div>
      
      <Button className="mt-4 bg-primary text-white flex items-center gap-2" onClick={() => toast.success("Pengaturan pembayaran disimpan!")}>
        <Save size={16} />
        Simpan Pengaturan Pembayaran
      </Button>
    </div>
  );
}

// Receipt Settings Component
function ReceiptSettings() {
  const [showLogo, setShowLogo] = useState(true);
  const [showTaxInfo, setShowTaxInfo] = useState(true);
  const [showCustomMessage, setShowCustomMessage] = useState(false);
  const [customMessage, setCustomMessage] = useState("Terima kasih atas kunjungan Anda!");
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium flex items-center gap-2">
          <FileText size={18} className="text-primary" />
          Kustomisasi Struk
        </h3>
        <p className="text-sm text-muted-foreground">
          Kustomisasi bagaimana struk diformat dan informasi apa yang mereka sertakan.
        </p>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between space-x-2">
          <div className="flex-1 space-y-1">
            <p className="font-medium">Tampilkan Logo Bisnis</p>
            <p className="text-sm text-muted-foreground">
              Tampilkan logo bisnis Anda di bagian atas struk.
            </p>
          </div>
          <Switch
            checked={showLogo}
            onCheckedChange={setShowLogo}
          />
        </div>
        
        <div className="flex items-center justify-between space-x-2">
          <div className="flex-1 space-y-1">
            <p className="font-medium">Sertakan Informasi Pajak</p>
            <p className="text-sm text-muted-foreground">
              Tampilkan rincian pajak dan NPWP bisnis pada struk.
            </p>
          </div>
          <Switch
            checked={showTaxInfo}
            onCheckedChange={setShowTaxInfo}
          />
        </div>
        
        <div className="flex items-center justify-between space-x-2">
          <div className="flex-1 space-y-1">
            <p className="font-medium">Pesan Terima Kasih Kustom</p>
            <p className="text-sm text-muted-foreground">
              Tambahkan pesan personal di bagian bawah struk.
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
              placeholder="Masukkan pesan kustom Anda"
              className="w-full"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Pesan ini akan muncul di bagian bawah semua struk.
            </p>
          </div>
        )}
      </div>
      
      <Button className="mt-4 bg-primary text-white flex items-center gap-2" onClick={() => toast.success("Pengaturan struk disimpan!")}>
        <Save size={16} />
        Simpan Pengaturan Struk
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
          Pengaturan Keamanan
        </h3>
        <p className="text-sm text-muted-foreground">
          Konfigurasi opsi keamanan untuk akun dan aplikasi Anda.
        </p>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between space-x-2">
          <div className="flex-1 space-y-1">
            <p className="font-medium">Autentikasi Dua Faktor</p>
            <p className="text-sm text-muted-foreground">
              Tambahkan lapisan keamanan ekstra untuk akun Anda.
            </p>
          </div>
          <Switch
            checked={twoFactorEnabled}
            onCheckedChange={setTwoFactorEnabled}
          />
        </div>
        
        <div className="flex items-center justify-between space-x-2">
          <div className="flex-1 space-y-1">
            <p className="font-medium">Reset Kata Sandi Berkala</p>
            <p className="text-sm text-muted-foreground">
              Wajibkan perubahan kata sandi setiap 90 hari.
            </p>
          </div>
          <Switch
            checked={requirePasswordReset}
            onCheckedChange={setRequirePasswordReset}
          />
        </div>
        
        <div className="flex items-center justify-between space-x-2">
          <div className="flex-1 space-y-1">
            <p className="font-medium">Pencatatan Aktivitas</p>
            <p className="text-sm text-muted-foreground">
              Simpan log semua tindakan yang dilakukan dalam sistem.
            </p>
          </div>
          <Switch
            checked={activityLogging}
            onCheckedChange={setActivityLogging}
          />
        </div>
      </div>
      
      <div className="pt-4">
        <Button className="bg-primary text-white flex items-center gap-2" onClick={() => toast.success("Pengaturan keamanan disimpan!")}>
          <Save size={16} />
          Simpan Pengaturan Keamanan
        </Button>
        
        <Button variant="outline" className="ml-4">
          Ubah Kata Sandi
        </Button>
      </div>
    </div>
  );
}

export default Settings;
