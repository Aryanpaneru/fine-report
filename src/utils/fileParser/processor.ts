/**
 * Processes and normalizes financial data after parsing
 */
export const processFinancialData = (data: any[]) => {
  console.log('Processing data, raw length:', data.length);
  
  // Filter out rows without required fields and normalize column names
  const processedData = data.filter((row: any) => {
    // Find the actual column names (might be case variations)
    const rowKeys = Object.keys(row);
    
    // Try to identify column names by casing and common variations
    const particularsKey = rowKeys.find(k => 
      k.toLowerCase() === 'particulars' || 
      k.toLowerCase() === 'account' || 
      k.toLowerCase() === 'description' || 
      k.toLowerCase() === 'item' ||
      k.toLowerCase() === 'account name' || 
      k.toLowerCase() === 'account description'
    );
    
    const debitKey = rowKeys.find(k => 
      k.toLowerCase() === 'debit' || 
      k.toLowerCase() === 'dr' || 
      k.toLowerCase() === 'debit amount' ||
      k.toLowerCase() === 'amount (dr)'
    );
    
    const creditKey = rowKeys.find(k => 
      k.toLowerCase() === 'credit' || 
      k.toLowerCase() === 'cr' || 
      k.toLowerCase() === 'credit amount' ||
      k.toLowerCase() === 'amount (cr)'
    );
    
    // Check if the row has the necessary properties or can be converted
    const hasParticulars = particularsKey && row[particularsKey];
    const hasDebit = debitKey && (row[debitKey] !== undefined && row[debitKey] !== null && row[debitKey] !== '');
    const hasCredit = creditKey && (row[creditKey] !== undefined && row[creditKey] !== null && row[creditKey] !== '');
    
    // Handle row with special case - if there's a column that contains both amount and type
    if (!hasDebit && !hasCredit) {
      // Try to find a generic "amount" column
      const amountKey = rowKeys.find(k => 
        k.toLowerCase().includes('amount') && 
        !k.toLowerCase().includes('cr') && 
        !k.toLowerCase().includes('dr')
      );
      
      // Try to find type column (debit/credit indicator)
      const typeKey = rowKeys.find(k => 
        k.toLowerCase() === 'type' || 
        k.toLowerCase() === 'dc' || 
        k.toLowerCase() === 'dr/cr'
      );
      
      if (hasParticulars && amountKey && typeKey) {
        const amount = parseFloat(row[amountKey]) || 0;
        const type = row[typeKey].toString().toLowerCase();
        
        if (type.includes('dr') || type.includes('debit')) {
          row.Debit = amount;
          row.Credit = '';
          return true;
        } else if (type.includes('cr') || type.includes('credit')) {
          row.Debit = '';
          row.Credit = amount;
          return true;
        }
      }
      
      // If we have a single amount column and sign indicates dr/cr
      if (hasParticulars && amountKey && !typeKey) {
        // Check if the amount is positive or negative
        const amount = parseFloat(row[amountKey]) || 0;
        if (amount !== 0) {
          if (amount > 0) {
            row.Debit = amount;
            row.Credit = '';
          } else {
            row.Debit = '';
            row.Credit = Math.abs(amount);
          }
          return true;
        }
      }
    }
    
    // Normalize the data if needed
    if (hasParticulars && (hasDebit || hasCredit)) {
      // Standardize the property names
      row.Particulars = row[particularsKey];
      row.Debit = hasDebit ? parseFloat(row[debitKey]) || row[debitKey] : '';
      row.Credit = hasCredit ? parseFloat(row[creditKey]) || row[creditKey] : '';
      
      // Remove potential duplicate properties with different casing
      if (particularsKey !== 'Particulars') delete row[particularsKey];
      if (debitKey !== 'Debit') delete row[debitKey];
      if (creditKey !== 'Credit') delete row[creditKey];
      
      // Remove any other properties, keeping only the three required ones
      Object.keys(row).forEach(key => {
        if (!['Particulars', 'Debit', 'Credit'].includes(key)) {
          delete row[key];
        }
      });
      
      return true;
    }
    
    return false;
  });
  
  console.log('Processed data length:', processedData.length);
  return processedData;
};
