
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

type FileParseCallback = (data: any[]) => void;
type ErrorCallback = (error: any) => void;

// Expected column structure for valid financial data
// Format expected:
// Particulars (string): Account name such as "Sales", "Purchases", "Capital", etc.
// Debit (number): Debit amounts (e.g., 5000, 2500)
// Credit (number): Credit amounts (e.g., 3000, 1200)
const REQUIRED_COLUMNS = ['Particulars', 'Debit', 'Credit'];

export const parseFinancialFile = (
  file: File, 
  onSuccess: FileParseCallback, 
  onError: ErrorCallback
) => {
  console.log('Parsing file:', file.name, 'Type:', file.type);
  
  try {
    if (file.type === 'text/csv') {
      console.log('Parsing CSV file');
      Papa.parse(file, {
        header: true,
        complete: (results) => {
          console.log('CSV Parse results:', results);
          if (results.errors && results.errors.length > 0) {
            console.error('CSV parsing errors:', results.errors);
            onError(results.errors);
            return;
          }
          
          // Validate the parsed data structure
          const validationResult = validateFinancialData(results.data);
          if (!validationResult.valid) {
            onError(new Error(validationResult.message));
            return;
          }
          
          onSuccess(results.data);
        },
        error: (error) => {
          console.error('CSV parse error:', error);
          onError(error);
        }
      });
    } else {
      // Handle any Excel file format
      console.log('Parsing Excel file');
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          if (!data) {
            throw new Error('Failed to read file data');
          }

          // Parse the workbook using appropriate method based on data type
          const workbook = parseWorkbook(data);
          if (!workbook) {
            throw new Error('Failed to parse Excel file');
          }
          
          console.log('Excel workbook loaded:', workbook.SheetNames);
          
          // Get the first sheet
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          // Convert to JSON with headers
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          console.log('Excel JSON data:', jsonData);
          
          // Validate the parsed data structure
          const validationResult = validateFinancialData(jsonData);
          if (!validationResult.valid) {
            onError(new Error(validationResult.message));
            return;
          }
          
          onSuccess(jsonData);
        } catch (error) {
          console.error('Excel processing error:', error);
          onError(error);
        }
      };
      
      reader.onerror = (error) => {
        console.error('FileReader error:', error);
        onError(error);
      };
      
      // Read the file as an array buffer for all Excel formats
      reader.readAsArrayBuffer(file);
    }
  } catch (error) {
    console.error('File parsing error:', error);
    onError(error);
  }
};

// Helper function to parse workbook from any format
const parseWorkbook = (data: string | ArrayBuffer): XLSX.WorkBook | null => {
  try {
    // For ArrayBuffer (most Excel files)
    if (data instanceof ArrayBuffer) {
      return XLSX.read(data, { type: 'array' });
    }
    // For string data (some older formats)
    else if (typeof data === 'string') {
      return XLSX.read(data, { type: 'binary' });
    }
    return null;
  } catch (error) {
    console.error('Error parsing workbook:', error);
    return null;
  }
};

// Validate that the data has the expected structure for financial data
export const validateFinancialData = (data: any[]): { valid: boolean; message: string } => {
  if (!Array.isArray(data) || data.length === 0) {
    return { 
      valid: false, 
      message: 'File contains no data or is not in the expected format' 
    };
  }
  
  // Check if the required columns exist in the first row
  const firstRow = data[0];
  const headers = Object.keys(firstRow);
  
  // Check for required columns (case-insensitive)
  const normalizedHeaders = headers.map(h => h.toLowerCase());
  const missingColumns = REQUIRED_COLUMNS.filter(col => 
    !normalizedHeaders.includes(col.toLowerCase())
  );
  
  if (missingColumns.length > 0) {
    return { 
      valid: false, 
      message: `Missing required columns: ${missingColumns.join(', ')}. Required format is: Particulars, Debit, Credit` 
    };
  }

  // Normalize the data structure
  const processedData = processFinancialData(data);
  
  // Make sure there's at least one valid entry
  if (processedData.length === 0) {
    return {
      valid: false,
      message: 'No valid financial entries found. Each entry must have Particulars and either Debit or Credit value.'
    };
  }
  
  return { valid: true, message: 'Data is valid' };
};

export const processFinancialData = (data: any[]) => {
  console.log('Processing data, raw length:', data.length);
  
  // Filter out rows without required fields and normalize column names
  const processedData = data.filter((row: any) => {
    // Find the actual column names (might be case variations)
    const rowKeys = Object.keys(row);
    const particularsKey = rowKeys.find(k => k.toLowerCase() === 'particulars');
    const debitKey = rowKeys.find(k => k.toLowerCase() === 'debit');
    const creditKey = rowKeys.find(k => k.toLowerCase() === 'credit');
    
    // Check if the row has the necessary properties
    const hasParticulars = particularsKey && row[particularsKey];
    const hasDebit = debitKey && (row[debitKey] !== undefined && row[debitKey] !== null && row[debitKey] !== '');
    const hasCredit = creditKey && (row[creditKey] !== undefined && row[creditKey] !== null && row[creditKey] !== '');
    
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
      
      return true;
    }
    return false;
  });
  
  console.log('Processed data length:', processedData.length);
  return processedData;
};
