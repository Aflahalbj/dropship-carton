
import React from 'react';
import { format } from 'date-fns';
import { CartItem } from '../context/AppContext';

interface ReceiptProps {
  items: CartItem[];
  total: number;
  date: Date;
  transactionId?: string;
}

const Receipt = React.forwardRef<HTMLDivElement, ReceiptProps>(
  ({ items, total, date, transactionId }, ref) => {
    return (
      <div ref={ref} className="p-4 max-w-md mx-auto bg-white text-black print:shadow-none">
        <div className="text-center mb-4">
          <h2 className="text-xl font-bold">Struk Penjualan</h2>
          <p className="text-sm">{format(date, "d MMMM yyyy 'pukul' HH:mm")}</p>
          {transactionId && (
            <p className="text-xs text-gray-500">Transaksi #{transactionId.slice(-6)}</p>
          )}
        </div>
        
        <div className="border-t border-b border-gray-200 py-2 mb-4">
          <div className="flex font-medium text-sm mb-1">
            <span className="flex-1">Item</span>
            <span className="w-16 text-right">Harga</span>
            <span className="w-12 text-center">Jml</span>
            <span className="w-20 text-right">Total</span>
          </div>
          
          {items.map((item, index) => (
            <div key={index} className="flex text-sm py-1">
              <span className="flex-1">{item.product.name}</span>
              <span className="w-16 text-right">Rp{item.product.price.toLocaleString('id-ID')}</span>
              <span className="w-12 text-center">{item.quantity}</span>
              <span className="w-20 text-right">Rp{(item.product.price * item.quantity).toLocaleString('id-ID')}</span>
            </div>
          ))}
        </div>
        
        <div className="flex justify-between text-sm mb-1">
          <span>Subtotal:</span>
          <span>Rp{total.toLocaleString('id-ID')}</span>
        </div>
        
        <div className="flex justify-between font-bold text-lg mt-2">
          <span>Total:</span>
          <span>Rp{total.toLocaleString('id-ID')}</span>
        </div>
        
        <div className="mt-8 text-center text-xs text-gray-500">
          <p>Terima kasih atas pembelian Anda!</p>
          <p>Mohon simpan struk ini untuk catatan Anda.</p>
        </div>
      </div>
    );
  }
);

Receipt.displayName = "Receipt";

export default Receipt;
