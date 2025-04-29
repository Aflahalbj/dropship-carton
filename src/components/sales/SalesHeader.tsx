
import React from 'react';
import { BluetoothPrinter } from '@/components/BluetoothPrinter';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

interface SalesHeaderProps {
  title: string;
  description: string;
}

const SalesHeader: React.FC<SalesHeaderProps> = ({ title, description }) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
        <p className="text-muted-foreground">{description}</p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Printer size={18} />
          Cetak
        </Button>
        <BluetoothPrinter />
      </div>
    </div>
  );
};

export default SalesHeader;
