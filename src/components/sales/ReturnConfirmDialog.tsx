
import React from 'react';
import {
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction
} from "@/components/ui/alert-dialog";

interface ReturnConfirmDialogProps {
  onConfirm: () => void;
}

const ReturnConfirmDialog: React.FC<ReturnConfirmDialogProps> = ({ onConfirm }) => {
  return (
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Proses Pengembalian Produk</AlertDialogTitle>
        <AlertDialogDescription>
          Apakah Anda yakin ingin memproses pengembalian produk untuk transaksi ini? 
          Proses ini untuk produk yang exp, cacat, tidak sesuai, atau alasan lainnya.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Batal</AlertDialogCancel>
        <AlertDialogAction onClick={onConfirm}>Proses Pengembalian</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  );
};

export default ReturnConfirmDialog;
