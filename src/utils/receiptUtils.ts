
export const generateReceiptText = (transaction: any): string => {
  if (!transaction) return "";
  
  let text = "";
  // Format yang optimal untuk printer thermal
  // Toko info
  text += "TOKO ABDULLAH\n";
  text += "TANGERANG\n";
  text += "083880863610\n\n";
  
  if (transaction.customerName) {
    text += `Pelanggan: ${transaction.customerName}\n`;
  }
  
  // Garis pemisah
  text += "--------------------------------\n";
  text += `No - ${transaction.id?.slice(-4) || "0001"}   `;
  
  // Format tanggal dan waktu yang lebih konsisten
  try {
    const txDate = new Date(transaction.date);
    text += `${txDate.toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}   `;
    text += `${txDate.toLocaleDateString('id-ID', {day: '2-digit', month: '2-digit', year: '2-digit'})}\n`;
  } catch (e) {
    text += `${new Date().toLocaleTimeString('id-ID')}   `;
    text += `${new Date().toLocaleDateString('id-ID')}\n`;
  }
  
  text += "--------------------------------\n\n";
  
  // Items - format untuk printer 58mm
  if (transaction.products && Array.isArray(transaction.products)) {
    transaction.products.forEach((item: any) => {
      // Nama produk dengan pembatasan panjang jika diperlukan
      const productName = (item.product?.name || "Produk").substring(0, 30);
      text += `${productName}\n`;
      
      // Kuantitas dan harga yang terformat dengan baik
      const qty = item.quantity || 1;
      const price = item.product?.price || 0;
      const subtotal = qty * price;
      
      // Format harga dengan ribuan yang lebih rapi untuk printer thermal
      text += `${qty} x ${formatCurrency(price)}`;
      // Spasi yang cukup untuk alignment di printer thermal
      const spaces = calculateSpaces(qty, price);
      text += `${spaces}${formatCurrency(subtotal)}\n\n`;
    });
  }
  
  // Informasi total dan pembayaran
  text += "--------------------------------\n";
  text += `Total                ${formatCurrency(transaction.amount || 0)}\n`;
  
  // Informasi metode pembayaran
  const methodText = transaction.paymentMethod === 'cash' ? 'Tunai' : 'Transfer';
  text += `Bayar (${methodText})      ${formatCurrency(transaction.cashAmount || transaction.amount || 0)}\n`;
  text += `Kembali              ${formatCurrency(transaction.changeAmount || 0)}\n\n`;
  
  // Footer
  text += `\n`;
  text += `      Terimakasih      \n`;
  text += `    Selamat Belanja    \n`;
  text += `          ^_^          \n`;
  
  return text;
};

// Fungsi untuk menghitung spasi yang dibutuhkan untuk alignment
function calculateSpaces(quantity: number, price: number): string {
  // Estimasi panjang string untuk qty dan harga
  const leftSideLength = `${quantity} x ${formatCurrency(price)}`.length;
  
  // Total lebar untuk printer thermal 58mm sekitar 32 karakter
  const totalWidth = 32;
  const neededSpaces = Math.max(1, totalWidth - leftSideLength - 10); // 10 adalah perkiraan untuk format harga subtotal
  
  return ' '.repeat(neededSpaces);
}

// Fungsi untuk format mata uang yang optimal untuk printer thermal
function formatCurrency(amount: number): string {
  try {
    return `Rp${amount.toLocaleString('id-ID').replace(/\./g, ',')}`;
  } catch (e) {
    return `Rp${amount}`;
  }
}

export default { generateReceiptText };
