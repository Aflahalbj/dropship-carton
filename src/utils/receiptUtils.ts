
export const generateReceiptText = (transaction: any): string => {
  if (!transaction) return "";
  
  let text = "";
  text += "TOKO ABDULLAH\n";
  text += "TANGERANG\n";
  text += "083880863610\n\n";
  
  if (transaction.customerName) {
    text += `Tuan/Bos: ${transaction.customerName}\n`;
  }
  text += `--------------------------------\n`;
  text += `No - ${transaction.id?.slice(-2) || "01"}   `;
  text += `${new Date(transaction.date).toLocaleTimeString('id-ID')}   `;
  text += `${new Date(transaction.date).toLocaleDateString('id-ID')}\n`;
  text += `--------------------------------\n\n`;
  
  // Items
  transaction.products?.forEach((item: any) => {
    text += `${item.product.name}\n`;
    text += `${item.quantity} x ${item.product.price.toLocaleString('id-ID')}`;
    text += `          Rp ${(item.product.price * item.quantity).toLocaleString('id-ID')}\n\n`;
  });
  
  text += `--------------------------------\n`;
  text += `Total                Rp ${transaction.amount?.toLocaleString('id-ID')}\n`;
  text += `Bayar (${transaction.paymentMethod === 'cash' ? 'Cash' : 'Transfer'})      Rp ${(transaction.cashAmount || transaction.amount).toLocaleString('id-ID')}\n`;
  text += `Kembali              Rp ${(transaction.changeAmount || 0).toLocaleString('id-ID')}\n\n`;
  
  text += `\n\n`;
  text += `      Terimakasih telah berbelanja di toko kami      \n`;
  text += `                      ^_^                      \n`;
  
  return text;
};

export default { generateReceiptText };
