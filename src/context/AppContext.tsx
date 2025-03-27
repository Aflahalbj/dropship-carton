
  // Expense functions
  const addExpense = (expense: Omit<Expense, 'id'>): boolean => {
    if (!subtractFromCapital(expense.amount)) {
      return false;
    }
    
    const newExpense = {
      ...expense,
      id: Date.now().toString(),
    };
    
    setExpenses(prev => [...prev, newExpense]);
    toast.success(`Expense recorded: $${expense.amount.toFixed(2)}`);
    return true;
  };
