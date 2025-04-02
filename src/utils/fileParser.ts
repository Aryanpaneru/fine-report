
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

type FileParseCallback = (data: any[]) => void;
type ErrorCallback = (error: any) => void;

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
          onSuccess(results.data);
        },
        error: (error) => {
          console.error('CSV parse error:', error);
          onError(error);
        }
      });
    } else {
      // Handle Excel files
      console.log('Parsing Excel file');
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          if (!data) {
            throw new Error('Failed to read file data');
          }

          let workbook;
          // Need to properly handle different types of Excel files
          if (typeof data === 'string') {
            // For older Excel files (.xls) or CSV treated as Excel
            workbook = XLSX.read(data, { type: 'binary' });
          } else {
            // For newer Excel files (.xlsx)
            const arraybuffer = data;
            workbook = XLSX.read(arraybuffer, { type: 'array' });
          }

          console.log('Excel workbook loaded:', workbook.SheetNames);
          
          // Get the first sheet
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          // Convert to JSON with headers
          const options = { header: 1, defval: "" };
          const rawData = XLSX.utils.sheet_to_json(worksheet, options) as unknown[][];
          
          console.log('Raw Excel data:', rawData);
          
          // Process the data to match expected format
          if (rawData && Array.isArray(rawData) && rawData.length < 2) {
            throw new Error('Excel file does not contain enough data');
          }
          
          // Assuming first row is headers: Particulars, Debit, Credit
          const headers = rawData[0] as string[];
          const processedData = [];
          
          for (let i = 1; i < rawData.length; i++) {
            const row = rawData[i] as any[];
            if (row && Array.isArray(row) && row.length >= 3) {
              const entry: any = {};
              for (let j = 0; j < headers.length; j++) {
                entry[headers[j]] = row[j];
              }
              processedData.push(entry);
            }
          }
          
          console.log('Processed Excel data:', processedData);
          onSuccess(processedData);
        } catch (error) {
          console.error('Excel processing error:', error);
          onError(error);
        }
      };
      
      reader.onerror = (error) => {
        console.error('FileReader error:', error);
        onError(error);
      };
      
      // Determine the correct way to read the file
      if (file.type === 'text/csv') {
        reader.readAsText(file);
      } else {
        reader.readAsArrayBuffer(file);
      }
    }
  } catch (error) {
    console.error('File parsing error:', error);
    onError(error);
  }
};

export const processFinancialData = (data: any[]) => {
  console.log('Processing data, raw length:', data.length);
  
  // Filter out rows without required fields
  const processedData = data.filter((row: any) => {
    // Check if the row has the necessary properties
    const hasParticulars = row.Particulars || row.particulars || row[0];
    const hasDebit = row.Debit || row.debit || row[1];
    const hasCredit = row.Credit || row.credit || row[2];
    
    // Normalize the data if needed
    if (hasParticulars && (hasDebit || hasCredit)) {
      // Make sure the row has the expected property names
      if (!row.Particulars && (row.particulars || row[0])) {
        row.Particulars = row.particulars || row[0];
      }
      if (!row.Debit && (row.debit || row[1])) {
        row.Debit = row.debit || row[1];
      }
      if (!row.Credit && (row.credit || row[2])) {
        row.Credit = row.credit || row[2];
      }
      return true;
    }
    return false;
  });
  
  console.log('Processed data length:', processedData.length);
  return processedData;
};
