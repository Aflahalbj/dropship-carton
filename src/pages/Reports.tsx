
import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const Reports = () => {
  return (
    <div className="animate-slide-up">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Laporan</h2>
          <p className="text-muted-foreground">Analisis performa bisnis Anda</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="p-6 col-span-1 md:col-span-3 flex flex-col items-center justify-center text-center py-12">
          <Info size={48} className="text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Tidak ada data laporan</h3>
          <p className="text-muted-foreground mb-6">
            Belum ada data transaksi yang tersedia untuk dianalisis
          </p>
          <Button>Buat Transaksi Baru</Button>
        </Card>
      </div>
    </div>
  );
};

export default Reports;
