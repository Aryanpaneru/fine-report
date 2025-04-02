
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { AlertCircle, CheckCircle, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import FileUploader from './dashboard/FileUploader';
import * as XLSX from 'xlsx';

const DataCleanup = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedData, setProcessedData] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setProcessedData(null);
    setError(null);
  };

  const processFile = () => {
    if (!file) return;
    
    setIsProcessing(true);
    setError(null);
    
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        let rawData: any[] = [];
        
        // Parse the file based on its type
        if (file.name.toLowerCase().endsWith('.csv')) {
          // Parse CSV
          const text = data as string;
          const lines = text.split('\n');
          const headers = lines[0].split(',').map(h => h.trim());
          
          if (headers.length !== 3) {
            setError('The file must contain exactly 3 columns. Please check your file format.');
            setIsProcessing(false);
            return;
          }
          
          // Process data rows
          for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue; // Skip empty lines
            
            const values = lines[i].split(',').map(v => v.trim());
            if (values.length !== 3) continue; // Skip malformed rows
            
            const row: any = {};
            headers.forEach((header, index) => {
              row[header] = values[index];
            });
            
            rawData.push(row);
          }
        } else {
          // Parse Excel
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
          
          // Check if the file has exactly 3 columns
          const firstRow = jsonData[0] as any[];
          if (!firstRow || firstRow.length !== 3) {
            setError('The file must contain exactly 3 columns. Please check your file format.');
            setIsProcessing(false);
            return;
          }
          
          const headers = (jsonData[0] as any[]).map(h => String(h).trim());
          
          // Process data rows
          for (let i = 1; i < jsonData.length; i++) {
            const rowData = jsonData[i] as any[];
            if (!rowData || rowData.length === 0) continue;
            
            if (rowData.length !== 3) continue; // Skip malformed rows
            
            const row: any = {};
            headers.forEach((header, index) => {
              row[header] = rowData[index];
            });
            
            rawData.push(row);
          }
        }
        
        if (rawData.length === 0) {
          setError('No valid data found in the file. Please check the format.');
          setIsProcessing(false);
          return;
        }
        
        // Convert the data to our required format
        const processedData = rawData.map(row => {
          const keys = Object.keys(row);
          return {
            Particulars: row[keys[0]],
            Debit: row[keys[1]],
            Credit: row[keys[2]]
          };
        });
        
        setProcessedData(processedData);
        toast({
          title: "Data Processed Successfully",
          description: `Converted ${processedData.length} rows to the standard format.`,
        });
        
        setIsProcessing(false);
      } catch (err: any) {
        console.error('Data processing error:', err);
        setError(err.message || 'There was an error processing your data');
        setIsProcessing(false);
      }
    };
    
    reader.onerror = () => {
      setError('There was an error reading the file');
      setIsProcessing(false);
    };
    
    if (file.name.toLowerCase().endsWith('.csv')) {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  };

  const downloadProcessedData = () => {
    if (!processedData || processedData.length === 0) return;
    
    try {
      // Create a worksheet from the processed data
      const worksheet = XLSX.utils.json_to_sheet(processedData);
      
      // Create a workbook with the worksheet
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Formatted Data');
      
      // Generate the file
      XLSX.writeFile(workbook, 'formatted_financial_data.xlsx');
      
      toast({
        title: "File Downloaded",
        description: "The formatted data has been downloaded successfully.",
      });
    } catch (err: any) {
      console.error('Download error:', err);
      toast({
        title: "Download Error",
        description: err.message || "There was an error downloading the file",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8 text-center">Data Cleanup Tool</h1>
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Card className="shadow-lg mb-8 dark:border-gray-700">
        <CardHeader>
          <CardTitle>Convert Your 3-Column Data</CardTitle>
          <CardDescription>
            Upload any file with exactly 3 columns. We'll automatically convert it to the format required for analysis.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FileUploader onFileSelect={handleFileSelect} />
        </CardContent>
        <CardFooter className="flex justify-between">
          <p className="text-sm text-muted-foreground">
            Accepted formats: .csv, .xlsx, .xls, .ods
          </p>
          <Button 
            onClick={processFile} 
            disabled={!file || isProcessing}
          >
            {isProcessing ? "Processing..." : "Process & Convert"}
          </Button>
        </CardFooter>
      </Card>
      
      {processedData && processedData.length > 0 && (
        <Card className="shadow-lg dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Processed Data</CardTitle>
              <CardDescription>
                Your data has been converted to the standard format. You can now download it.
              </CardDescription>
            </div>
            <Button onClick={downloadProcessedData} variant="outline" className="ml-2">
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md overflow-hidden dark:border-gray-700">
              <div className="max-h-80 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Particulars</TableHead>
                      <TableHead>Debit</TableHead>
                      <TableHead>Credit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {processedData.slice(0, 10).map((row, index) => (
                      <TableRow key={index}>
                        <TableCell>{row.Particulars}</TableCell>
                        <TableCell>{row.Debit}</TableCell>
                        <TableCell>{row.Credit}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {processedData.length > 10 && (
                <div className="text-center py-2 text-sm text-muted-foreground border-t dark:border-gray-700">
                  Showing 10 of {processedData.length} rows
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <div className="flex items-center text-sm text-green-600 dark:text-green-400">
              <CheckCircle className="h-4 w-4 mr-2" />
              This format is ready to be uploaded to the Financial Analyzer
            </div>
          </CardFooter>
        </Card>
      )}
    </div>
  );
};

export default DataCleanup;
