
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileUp, FileX } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

const Dashboard = () => {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    const excelTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'application/octet-stream', // Sometimes Excel files are reported as this
      'application/vnd.oasis.opendocument.spreadsheet' // .ods
    ];
    
    if (file.type === 'text/csv' || excelTypes.includes(file.type)) {
      setFile(file);
      setFileName(file.name);
    } else {
      console.log('Invalid file type:', file.type);
      toast({
        title: "Invalid File Type",
        description: "Please upload a CSV or Excel file.",
        variant: "destructive",
      });
    }
  };

  const parseFile = () => {
    if (!file) return;
    
    setIsUploading(true);
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
              toast({
                title: "CSV Parsing Error",
                description: "The CSV file could not be parsed correctly. Please check the format.",
                variant: "destructive",
              });
              setIsUploading(false);
              return;
            }
            processData(results.data);
          },
          error: (error) => {
            console.error('CSV parse error:', error);
            handleError(error);
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
            const rawData = XLSX.utils.sheet_to_json(worksheet, options);
            
            console.log('Raw Excel data:', rawData);
            
            // Process the data to match expected format
            if (rawData.length < 2) {
              throw new Error('Excel file does not contain enough data');
            }
            
            // Assuming first row is headers: Particulars, Debit, Credit
            const headers = rawData[0];
            const processedData = [];
            
            for (let i = 1; i < rawData.length; i++) {
              const row = rawData[i];
              if (row.length >= 3) {
                const entry: any = {};
                for (let j = 0; j < headers.length; j++) {
                  entry[headers[j]] = row[j];
                }
                processedData.push(entry);
              }
            }
            
            console.log('Processed Excel data:', processedData);
            processData(processedData);
          } catch (error) {
            console.error('Excel processing error:', error);
            handleError(error);
          }
        };
        
        reader.onerror = (error) => {
          console.error('FileReader error:', error);
          handleError(error);
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
      handleError(error);
    }
  };

  const processData = (data: any[]) => {
    // Store data in local storage for use in other components
    try {
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
      
      if (processedData.length === 0) {
        toast({
          title: "No Valid Data",
          description: "The file does not contain any valid financial data. Please check the format.",
          variant: "destructive",
        });
        setIsUploading(false);
        return;
      }
      
      localStorage.setItem('financialData', JSON.stringify(processedData));
      
      setIsUploading(false);
      toast({
        title: "Upload Successful",
        description: "Your data has been processed. You can now generate reports.",
      });
      
      // Navigate to reports page
      navigate('/reports');
    } catch (error) {
      console.error('Data processing error:', error);
      handleError(error);
    }
  };

  const handleError = (error: any) => {
    console.error('Error processing file:', error);
    setIsUploading(false);
    toast({
      title: "Error Processing File",
      description: "There was an issue processing your file. Please check the format and try again.",
      variant: "destructive",
    });
  };

  const removeFile = () => {
    setFile(null);
    setFileName('');
  };

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8 text-center">Financial Data Upload</h1>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Upload Trial Balance</CardTitle>
          <CardDescription>
            Upload your trial balance in CSV or Excel format to generate financial reports and analyze key ratios.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div 
            className={`border-2 border-dashed rounded-lg p-10 text-center ${
              dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/20'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {fileName ? (
              <div className="flex flex-col items-center gap-2">
                <FileUp className="h-10 w-10 text-primary" />
                <p className="text-sm font-medium">{fileName}</p>
                <Button variant="outline" size="sm" onClick={removeFile}>
                  <FileX className="mr-2 h-4 w-4" />
                  Remove File
                </Button>
              </div>
            ) : (
              <>
                <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">Drag & drop your file here</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-4">
                  or click to browse your files
                </p>
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileChange}
                />
                <Button asChild variant="outline">
                  <label htmlFor="file-upload" className="cursor-pointer">Select File</label>
                </Button>
              </>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <p className="text-sm text-muted-foreground">
            Accepted formats: .csv, .xlsx, .xls
          </p>
          <Button 
            onClick={parseFile} 
            disabled={!file || isUploading}
          >
            {isUploading ? "Processing..." : "Process File"}
          </Button>
        </CardFooter>
      </Card>
      
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Expected Format</CardTitle>
            <CardDescription>
              The uploaded file should contain the following columns: Particulars, Debit, Credit
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Particulars</th>
                    <th className="text-right p-2">Debit</th>
                    <th className="text-right p-2">Credit</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="p-2">Sundry Debtors</td>
                    <td className="text-right p-2">43000</td>
                    <td className="text-right p-2"></td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2">Stock (01.01.2008)</td>
                    <td className="text-right p-2">23000</td>
                    <td className="text-right p-2"></td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2">Sales</td>
                    <td className="text-right p-2"></td>
                    <td className="text-right p-2">135000</td>
                  </tr>
                  <tr>
                    <td className="p-2">Capital</td>
                    <td className="text-right p-2"></td>
                    <td className="text-right p-2">72795</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
