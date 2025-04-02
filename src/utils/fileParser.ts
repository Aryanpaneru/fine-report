
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

type FileParseCallback = (data: any[], audit?: FileAuditResult) => void;
type ErrorCallback = (error: any) => void;

// Expected column structure for valid financial data
// Format expected:
// Particulars (string): Account name such as "Sales", "Purchases", "Capital", etc.
// Debit (number): Debit amounts (e.g., 5000, 2500)
// Credit (number): Credit amounts (e.g., 3000, 1200)
const REQUIRED_COLUMNS = ['Particulars', 'Debit', 'Credit'];

// Detailed audit information for file parsing
export interface FileAuditResult {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  issues: FileParsingIssue[];
  warnings: string[];
}

export interface FileParsingIssue {
  row?: number;
  issue: string;
  suggestion?: string;
}

export const parseFinancialFile = (
  file: File, 
  onSuccess: FileParseCallback, 
  onError: ErrorCallback
) => {
  console.log('Parsing file:', file.name, 'Type:', file.type);
  
  // Initialize audit object
  const audit: FileAuditResult = {
    totalRows: 0,
    validRows: 0,
    invalidRows: 0,
    issues: [],
    warnings: []
  };
  
  try {
    if (file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv')) {
      console.log('Parsing CSV file');
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          console.log('CSV Parse results:', results);
          audit.totalRows = results.data.length;
          
          if (results.errors && results.errors.length > 0) {
            console.error('CSV parsing errors:', results.errors);
            results.errors.forEach(error => {
              audit.issues.push({
                row: error.row,
                issue: `CSV parsing error: ${error.message || 'Unknown error'}`,
                suggestion: getSuggestionForCSVError(error.code)
              });
            });
            
            // Still try to process valid rows
            if (results.data.length > 0) {
              audit.warnings.push(`Encountered ${results.errors.length} CSV parsing errors but continuing with ${results.data.length} valid rows`);
            } else {
              onError(new Error(`CSV parsing failed: ${results.errors[0].message}`));
              return;
            }
          }
          
          // Clean header names by trimming whitespace
          const cleanedData = normalizeColumnNames(results.data);
          
          // Validate the parsed data structure
          const validationResult = validateFinancialData(cleanedData, audit);
          if (!validationResult.valid && audit.validRows === 0) {
            onError(new Error(validationResult.message));
            return;
          }
          
          const processedData = processFinancialData(validationResult.data);
          audit.validRows = processedData.length;
          audit.invalidRows = audit.totalRows - audit.validRows;
          
          onSuccess(processedData, audit);
        },
        error: (error) => {
          console.error('CSV parse error:', error);
          audit.issues.push({
            issue: `Failed to parse CSV file: ${error.message || 'Unknown error'}`,
            suggestion: 'Check that the file is properly formatted CSV and not corrupted'
          });
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
            audit.issues.push({
              issue: 'Failed to read file data',
              suggestion: 'The file might be corrupted or empty. Try re-exporting the file.'
            });
            throw new Error('Failed to read file data');
          }

          // Parse the workbook using appropriate method based on data type
          const workbook = parseWorkbook(data);
          if (!workbook) {
            audit.issues.push({
              issue: 'Failed to parse Excel file',
              suggestion: 'The file may be corrupted or in an unsupported format. Try saving as .xlsx or .csv.'
            });
            throw new Error('Failed to parse Excel file');
          }
          
          console.log('Excel workbook loaded:', workbook.SheetNames);
          
          if (workbook.SheetNames.length === 0) {
            audit.issues.push({
              issue: 'Excel file contains no sheets',
              suggestion: 'The file appears to be empty. Please ensure it contains at least one sheet with data.'
            });
            throw new Error('Excel file contains no sheets');
          }
          
          // Get the first sheet
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          // Check for merged cells which can cause parsing issues
          if (worksheet['!merges'] && worksheet['!merges'].length > 0) {
            audit.warnings.push(`Found ${worksheet['!merges'].length} merged cells which may cause data misalignment`);
          }
          
          // Convert to JSON with headers
          const options = { 
            defval: '',  // Default value for empty cells
            raw: false   // Convert values to strings
          };
          const jsonData = XLSX.utils.sheet_to_json(worksheet, options);
          console.log('Excel JSON data:', jsonData);
          
          audit.totalRows = jsonData.length;
          
          if (jsonData.length === 0) {
            audit.issues.push({
              issue: 'Excel sheet contains no data rows',
              suggestion: 'Ensure your Excel file has data rows with headers matching Particulars, Debit, and Credit'
            });
            throw new Error('Excel sheet contains no data rows');
          }
          
          // Clean header names by trimming whitespace
          const cleanedData = normalizeColumnNames(jsonData);
          
          // Validate the parsed data structure
          const validationResult = validateFinancialData(cleanedData, audit);
          
          if (!validationResult.valid && audit.validRows === 0) {
            onError(new Error(validationResult.message));
            return;
          }
          
          const processedData = processFinancialData(validationResult.data);
          audit.validRows = processedData.length;
          audit.invalidRows = audit.totalRows - audit.validRows;
          
          onSuccess(processedData, audit);
        } catch (error: any) {
          console.error('Excel processing error:', error);
          audit.issues.push({
            issue: `Excel processing error: ${error.message || 'Unknown error'}`,
            suggestion: 'Check file format and structure. Try exporting as CSV or XLSX.'
          });
          onError(error);
        }
      };
      
      reader.onerror = (error) => {
        console.error('FileReader error:', error);
        audit.issues.push({
          issue: 'File reading error',
          suggestion: 'The file might be corrupted or too large. Try with a smaller file or different format.'
        });
        onError(error);
      };
      
      // Read the file as an array buffer for all Excel formats
      reader.readAsArrayBuffer(file);
    }
  } catch (error: any) {
    console.error('File parsing error:', error);
    audit.issues.push({
      issue: `File parsing error: ${error.message || 'Unknown error'}`,
      suggestion: 'The file format might be unsupported or corrupted. Try saving as CSV.'
    });
    onError(error);
  }
};

// New helper function to normalize column names by trimming whitespace
const normalizeColumnNames = (data: any[]): any[] => {
  if (!data || data.length === 0) return data;
  
  return data.map(row => {
    const newRow: any = {};
    Object.keys(row).forEach(key => {
      // Trim whitespace from column names
      const trimmedKey = key.trim();
      newRow[trimmedKey] = row[key];
    });
    return newRow;
  });
};

// Helper function to get suggestions for CSV parsing errors
const getSuggestionForCSVError = (errorCode?: string): string => {
  switch (errorCode) {
    case 'QuoteNotClosed':
      return 'There is an unclosed quote in your CSV. Check for missing closing quotes.';
    case 'MissingQuotes':
      return 'Some fields are missing quotes. Ensure text fields with commas are properly quoted.';
    case 'UndetectableDelimiter':
      return 'The delimiter could not be detected. Ensure the file uses a standard delimiter like comma (,) or semicolon (;).';
    case 'TooFewFields':
    case 'TooManyFields':
      return 'Inconsistent number of columns. Check for missing commas or extra commas in some rows.';
    default:
      return 'Check the CSV format and ensure it follows standard CSV formatting rules.';
  }
};

// Helper function to parse workbook from any format
const parseWorkbook = (data: string | ArrayBuffer): XLSX.WorkBook | null => {
  try {
    // For ArrayBuffer (most Excel files)
    if (data instanceof ArrayBuffer) {
      // Try with all available options to maximize compatibility
      try {
        return XLSX.read(data, { type: 'array' });
      } catch (e) {
        // If default reading fails, try with more lenient options
        return XLSX.read(data, { 
          type: 'array',
          cellDates: true,
          cellNF: false,
          cellText: false
        });
      }
    }
    // For string data (some older formats)
    else if (typeof data === 'string') {
      try {
        return XLSX.read(data, { type: 'binary' });
      } catch (e) {
        // Try alternative parsing options
        return XLSX.read(data, { 
          type: 'binary',
          cellDates: true,
          cellNF: false,
          cellText: false 
        });
      }
    }
    return null;
  } catch (error) {
    console.error('Error parsing workbook:', error);
    return null;
  }
};

// Validate that the data has the expected structure for financial data
export const validateFinancialData = (data: any[], audit?: FileAuditResult): { valid: boolean; message: string; data: any[] } => {
  if (!Array.isArray(data) || data.length === 0) {
    if (audit) {
      audit.issues.push({
        issue: 'File contains no data or is not in the expected format',
        suggestion: 'Ensure the file contains data rows with proper headers'
      });
    }
    return { 
      valid: false, 
      message: 'File contains no data or is not in the expected format',
      data: []
    };
  }
  
  // Check if the required columns exist in the first row
  const firstRow = data[0];
  const headers = Object.keys(firstRow);
  
  console.log('Column headers found:', headers);
  
  // Check for required columns (case-insensitive)
  const normalizedHeaders = headers.map(h => h.toLowerCase());
  const missingColumns = REQUIRED_COLUMNS.filter(col => 
    !normalizedHeaders.includes(col.toLowerCase())
  );
  
  if (missingColumns.length > 0) {
    if (audit) {
      audit.issues.push({
        issue: `Missing required columns: ${missingColumns.join(', ')}`,
        suggestion: 'Make sure your file has headers for Particulars, Debit, and Credit (case-insensitive)'
      });
    }
    
    // Try to see if we can recover with similar column names
    const possibleMatches = findPossibleHeaderMatches(headers, missingColumns);
    if (possibleMatches.length > 0 && audit) {
      audit.warnings.push(`Found possible alternative headers: ${possibleMatches.join(', ')}`);
    }
    
    return { 
      valid: false, 
      message: `Missing required columns: ${missingColumns.join(', ')}. Required format is: Particulars, Debit, Credit`,
      data: []
    };
  }

  // Check each row and audit invalid rows if audit is provided
  if (audit) {
    data.forEach((row, index) => {
      // Find the actual column names (might be case variations)
      const rowKeys = Object.keys(row);
      const particularsKey = rowKeys.find(k => k.toLowerCase() === 'particulars');
      const debitKey = rowKeys.find(k => k.toLowerCase() === 'debit');
      const creditKey = rowKeys.find(k => k.toLowerCase() === 'credit');
      
      // Check if the row has the necessary properties
      const hasParticulars = particularsKey && row[particularsKey];
      const hasDebit = debitKey && (row[debitKey] !== undefined && row[debitKey] !== null && row[debitKey] !== '');
      const hasCredit = creditKey && (row[creditKey] !== undefined && row[creditKey] !== null && row[creditKey] !== '');
      
      if (!hasParticulars) {
        audit.issues.push({
          row: index + 1, // +1 for human-readable row number (accounting for header)
          issue: 'Missing Particulars value',
          suggestion: 'Each row must have an account name in the Particulars column'
        });
      }
      
      if (!hasDebit && !hasCredit) {
        audit.issues.push({
          row: index + 1,
          issue: 'Missing both Debit and Credit values',
          suggestion: 'Each row must have either a Debit or Credit value (or both)'
        });
      }
      
      // Check for non-numeric values in Debit/Credit columns
      if (hasDebit && isNaN(parseFloat(String(row[debitKey]))) && row[debitKey] !== '') {
        audit.issues.push({
          row: index + 1,
          issue: `Non-numeric Debit value: "${row[debitKey]}"`,
          suggestion: 'Debit values must be numeric'
        });
      }
      
      if (hasCredit && isNaN(parseFloat(String(row[creditKey]))) && row[creditKey] !== '') {
        audit.issues.push({
          row: index + 1,
          issue: `Non-numeric Credit value: "${row[creditKey]}"`,
          suggestion: 'Credit values must be numeric'
        });
      }
    });
  }
  
  return { valid: true, message: 'Data is valid', data };
};

// Helper function to find possible header matches for missing columns
const findPossibleHeaderMatches = (headers: string[], missingColumns: string[]): string[] => {
  const possibleMatches: string[] = [];
  
  missingColumns.forEach(missingCol => {
    const lowerMissingCol = missingCol.toLowerCase();
    
    // Check for partial matches or common variations
    headers.forEach(header => {
      const lowerHeader = header.toLowerCase();
      
      if (lowerMissingCol === 'particulars') {
        if (lowerHeader.includes('account') || 
            lowerHeader.includes('item') || 
            lowerHeader.includes('description') || 
            lowerHeader.includes('particular')) {
          possibleMatches.push(`${header} (possible match for Particulars)`);
        }
      } else if (lowerMissingCol === 'debit') {
        if (lowerHeader.includes('dr') || 
            lowerHeader.includes('debt') || 
            lowerHeader.includes('payment') ||
            lowerHeader.includes('expense')) {
          possibleMatches.push(`${header} (possible match for Debit)`);
        }
      } else if (lowerMissingCol === 'credit') {
        if (lowerHeader.includes('cr') || 
            lowerHeader.includes('cred') || 
            lowerHeader.includes('receipt') ||
            lowerHeader.includes('income')) {
          possibleMatches.push(`${header} (possible match for Credit)`);
        }
      }
    });
  });
  
  return possibleMatches;
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
