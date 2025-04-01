
// Function to generate random number within a range
const getRandomNumber = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Function to generate dates for the past month
const generateDatesForPastMonth = (): Date[] => {
  const dates: Date[] = [];
  const today = new Date();
  
  // Go back 30 days
  for (let i = 30; i >= 0; i--) {
    const date = new Date();
    date.setDate(today.getDate() - i);
    dates.push(date);
  }
  
  return dates;
};

// Generate mock sales data for the past month
export const generateMockSalesData = () => {
  const dates = generateDatesForPastMonth();
  
  return dates.map(date => {
    const formattedDate = date.toISOString().split('T')[0];
    
    return {
      date: formattedDate,
      sales: getRandomNumber(500000, 2000000), // Sales between 500k - 2M
      transactions: getRandomNumber(10, 50),
      products: getRandomNumber(15, 100)
    };
  });
};

// Generate mock expense data for the past month
export const generateMockExpenseData = () => {
  const dates = generateDatesForPastMonth();
  
  return dates.map(date => {
    const formattedDate = date.toISOString().split('T')[0];
    
    return {
      date: formattedDate,
      amount: getRandomNumber(200000, 1000000), // Expenses between 200k - 1M
      category: ['Inventory', 'Utilities', 'Rent', 'Salary', 'Marketing'][getRandomNumber(0, 4)]
    };
  });
};

// Generate mock product sales data
export const generateMockProductSalesData = () => {
  const productNames = [
    "Sepatu Casual Unisex", 
    "Tas Ransel Premium", 
    "Jam Tangan Digital", 
    "Kemeja Formal Pria", 
    "Dress Casual Wanita",
    "Celana Jeans Slim Fit",
    "Jaket Bomber Unisex",
    "Kacamata Fashion",
    "Topi Baseball Classic",
    "Sandal Slip-on"
  ];
  
  return productNames.map(product => {
    return {
      name: product,
      quantity: getRandomNumber(10, 100),
      revenue: getRandomNumber(500000, 5000000),
      profit: getRandomNumber(200000, 2000000)
    };
  });
};

// Generate mock monthly summary
export const generateMockMonthlySummary = () => {
  return {
    totalSales: getRandomNumber(15000000, 40000000),
    totalExpenses: getRandomNumber(7000000, 20000000),
    totalProfit: getRandomNumber(5000000, 20000000),
    totalTransactions: getRandomNumber(300, 800),
    averageTransactionValue: getRandomNumber(50000, 150000),
    topSellingCategories: [
      { name: "Sepatu", percentage: getRandomNumber(20, 40) },
      { name: "Pakaian", percentage: getRandomNumber(15, 30) },
      { name: "Aksesoris", percentage: getRandomNumber(10, 25) },
      { name: "Tas", percentage: getRandomNumber(10, 20) },
      { name: "Lainnya", percentage: getRandomNumber(5, 15) }
    ]
  };
};

// Calculate totals and growth
export const calculateMonthlyGrowth = () => {
  return {
    salesGrowth: getRandomNumber(-15, 25),
    profitGrowth: getRandomNumber(-10, 30),
    transactionGrowth: getRandomNumber(-5, 20),
    customerGrowth: getRandomNumber(0, 15)
  };
};
