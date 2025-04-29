
import React from 'react';
import { format } from 'date-fns';
import { CartItem } from '../context/AppContext';
import { Store } from 'lucide-react';

interface ReceiptProps {
  items: CartItem[];
  total: number;
  date: Date;
  transactionId?: string;
  paymentMethod?: string;
  customerName?: string;
  cashAmount?: number;
  changeAmount?: number;
}

const Receipt = React.forwardRef<HTMLDivElement, ReceiptProps>(
  ({ items, total, date, transactionId, paymentMethod, customerName, cashAmount, changeAmount }, ref) => {
    return (
      <div ref={ref} className="p-4 max-w-md mx-auto bg-white text-black print:shadow-none relative">
        {/* Wavy border at the top */}
        <div className="absolute top-0 left-0 right-0 h-4 bg-white" style={{
          clipPath: "url(#wave-top)"
        }}></div>

        {/* SVG Definitions for wavy borders */}
        <svg width="0" height="0" className="absolute">
          <defs>
            <clipPath id="wave-top" clipPathUnits="objectBoundingBox">
              <path d="M0,1 L0,0 L1,0 L1,1 C0.95,0.8 0.9,0.6 0.85,0.8 C0.8,1 0.75,0.8 0.7,0.6 C0.65,0.4 0.6,0.6 0.55,0.8 C0.5,1 0.45,0.8 0.4,0.6 C0.35,0.4 0.3,0.6 0.25,0.8 C0.2,1 0.15,0.8 0.1,0.6 C0.05,0.4 0,0.6 0,1 Z" />
            </clipPath>
            <clipPath id="wave-bottom" clipPathUnits="objectBoundingBox">
              <path d="M0,0 L0,1 L1,1 L1,0 C0.95,0.2 0.9,0.4 0.85,0.2 C0.8,0 0.75,0.2 0.7,0.4 C0.65,0.6 0.6,0.4 0.55,0.2 C0.5,0 0.45,0.2 0.4,0.4 C0.35,0.6 0.3,0.4 0.25,0.2 C0.2,0 0.15,0.2 0.1,0.4 C0.05,0.6 0,0.4 0,0 Z" />
            </clipPath>
          </defs>
        </svg>
        
        <div className="mt-2 bg-white pt-4 pb-4 border border-white">
          {/* Store Logo */}
          <div className="flex justify-center mb-2">
            <Store className="w-16 h-16" />
          </div>
          
          {/* Store Info */}
          <div className="text-center mb-4">
            <h2 className="text-xl font-bold">TOKO ABDULLAH</h2>
            <p className="text-sm">TANGERANG</p>
            <p className="text-sm mb-4">083880863610</p>
            
            {customerName && (
              <p className="text-left text-sm font-semibold">Tuan/Bos: {customerName}</p>
            )}
          </div>
          
          {/* Divider */}
          <hr className="border-t border-gray-800 my-2" />
          
          {/* Receipt Header */}
          <div className="flex justify-between text-sm mb-1">
            <span>No - {transactionId ? transactionId.slice(-2) : "01"}</span>
            <span>{format(date, "HH:mm:ss")}</span>
            <span>{format(date, "yyyy-MM-dd")}</span>
          </div>
          
          {/* Divider */}
          <hr className="border-t border-gray-800 my-2" />
          
          {/* Items */}
          <div className="space-y-2 mb-2">
            {items.map((item, index) => (
              <div key={index} className="text-left">
                <div className="font-semibold">{item.product.name}</div>
                <div className="flex justify-between">
                  <span>{item.quantity} x {item.product.price.toLocaleString('id-ID')}</span>
                  <span>Rp {(item.product.price * item.quantity).toLocaleString('id-ID')}</span>
                </div>
              </div>
            ))}
          </div>
          
          {/* Divider */}
          <hr className="border-t border-gray-800 my-2" />
          
          {/* Total */}
          <div className="flex justify-between text-sm font-semibold">
            <span>Total</span>
            <span>Rp {total.toLocaleString('id-ID')}</span>
          </div>
          
          {/* Payment Info */}
          <div className="flex justify-between text-sm">
            <span>Bayar ({paymentMethod === 'cash' ? 'Cash' : 'Transfer'})</span>
            <span>Rp {cashAmount?.toLocaleString('id-ID') || total.toLocaleString('id-ID')}</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span>Kembali</span>
            <span>Rp {changeAmount?.toLocaleString('id-ID') || "0"}</span>
          </div>
          
          {/* Thank You Message */}
          <div className="text-center mt-8 mb-2">
            <p className="text-sm">Terimakasih telah berbelanja di toko kami</p>
            <p className="text-xl">^_^</p>
          </div>
        </div>
        
        {/* Wavy border at the bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-4 bg-white" style={{
          clipPath: "url(#wave-bottom)"
        }}></div>
      </div>
    );
  }
);

Receipt.displayName = "Receipt";

export default Receipt;
