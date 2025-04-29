
import React from 'react';
import { BluetoothPrinter } from '@/components/BluetoothPrinter';

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
        <BluetoothPrinter />
      </div>
    </div>
  );
};

export default SalesHeader;
