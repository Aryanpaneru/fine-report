
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { AlertCircle, CheckCircle, Download, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import FileUploader from './dashboard/FileUploader';
import { parseFinancialFile, processFinancialData } from '@/utils/fileParser';
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
    
    parseFinancialFile(
      file,
      (data, audit) => {
        try {
          if (data.length === 0) {
            setError('The file does not contain any valid data. Please check the format.');
            setIsProcessing(false);
            return;
          }
          
          // Process the data to ensure it's in the right format
          const cleaned = processFinancialData(data);
          setProcessedData(cleaned);
          
          toast({
            title: "Data Processed Successfully",
            description: `Processed ${cleaned.length} rows into the standard format.`,
          });
          
          setIsProcessing(false);
        } catch (err: any) {
          console.error('Data processing error:', err);
          setError(err.message || 'There was an error processing your data');
          setIsProcessing(false);
        }
      },
      (err) => {
        console.error('Error parsing file:', err);
        setError(err.message || 'There was an error parsing your file');
        setIsProcessing(false);
      }
    );
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
      
      <Card className="shadow-lg mb-8">
        <CardHeader>
          <CardTitle>Convert Your Financial Data</CardTitle>
          <CardDescription>
            Upload your financial data with three columns. We'll automatically convert it to the format required for analysis.
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
        <Card className="shadow-lg">
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
            <div className="border rounded-md overflow-hidden">
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
                <div className="text-center py-2 text-sm text-muted-foreground border-t">
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
