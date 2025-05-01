
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
import { Checkbox } from "@/components/ui/checkbox";

interface DeleteConfirmDialogProps {
  restoreStock: boolean;
  onRestoreStockChange: (checked: boolean) => void;
  onConfirm: () => void;
}

const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({ 
  restoreStock, 
  onRestoreStockChange, 
  onConfirm 
}) => {
  return (
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Hapus Transaksi</AlertDialogTitle>
        <AlertDialogDescription>
          Apakah Anda yakin ingin menghapus transaksi ini? 
        </AlertDialogDescription>
        <div className="flex items-center space-x-2 mt-4">
          <Checkbox 
            id="restore-stock"
            checked={restoreStock}
            onCheckedChange={(checked) => onRestoreStockChange(checked as boolean)}
          />
          <label
            htmlFor="restore-stock"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Kembalikan stok barang
          </label>
        </div>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Batal</AlertDialogCancel>
        <AlertDialogAction 
          onClick={onConfirm} 
          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
        >
          Hapus Transaksi
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  );
};

export default DeleteConfirmDialog;
