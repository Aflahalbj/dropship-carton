
import React from 'react';
import { Button } from "@/components/ui/button";
import { PrinterIcon, Share, ArrowLeft, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface TransactionActionsProps {
  onPrint: () => void;
  onShare: () => void;
  onReturn: () => void;
  onDelete: () => void;
}

const TransactionActions: React.FC<TransactionActionsProps> = ({
  onPrint,
  onShare,
  onReturn,
  onDelete
}) => {
  return (
    <div className="grid grid-cols-4 gap-2 mt-6">
      <Button 
        onClick={onPrint} 
        variant="outline" 
        className="flex flex-col items-center justify-center py-4 h-auto"
      >
        <PrinterIcon className="h-5 w-5 mb-1" />
        <span className="text-xs">Print</span>
      </Button>
      
      <Button 
        onClick={onShare} 
        variant="outline" 
        className="flex flex-col items-center justify-center py-4 h-auto"
      >
        <Share className="h-5 w-5 mb-1" />
        <span className="text-xs">Share</span>
      </Button>
      
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button 
            variant="outline" 
            className="flex flex-col items-center justify-center py-4 h-auto"
          >
            <ArrowLeft className="h-5 w-5 mb-1" />
            <span className="text-xs">Return</span>
          </Button>
        </AlertDialogTrigger>
      </AlertDialog>
      
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button 
            variant="outline" 
            className="flex flex-col items-center justify-center py-4 h-auto"
          >
            <Trash2 className="h-5 w-5 mb-1" />
            <span className="text-xs">Delete</span>
          </Button>
        </AlertDialogTrigger>
      </AlertDialog>
    </div>
  );
};

export default TransactionActions;
