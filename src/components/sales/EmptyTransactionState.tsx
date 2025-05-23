
import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";
import { useNavigate } from 'react-router-dom';

const EmptyTransactionState: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 gap-6 mb-6">
      <Card className="p-6 flex flex-col items-center justify-center text-center py-12">
        <Info size={48} className="text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">Tidak ada data transaksi</h3>
        <p className="text-muted-foreground mb-6">
          Belum ada transaksi yang tercatat
        </p>
        <Button onClick={() => navigate("/")}>Buat Transaksi Baru</Button>
      </Card>
    </div>
  );
};

export default EmptyTransactionState;
