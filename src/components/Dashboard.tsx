
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
    if (file.type === 'text/csv' || file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || file.type === 'application/vnd.ms-excel') {
      setFile(file);
      setFileName(file.name);
    } else {
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
    
    try {
      if (file.type === 'text/csv') {
        Papa.parse(file, {
          header: true,
          complete: (results) => {
            processData(results.data);
          },
          error: (error) => {
            throw error;
          }
        });
      } else {
        // Handle Excel files
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = e.target?.result;
            const workbook = XLSX.read(data, { type: 'binary' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const json = XLSX.utils.sheet_to_json(worksheet);
            processData(json);
          } catch (error) {
            handleError(error);
          }
        };
        reader.onerror = (error) => handleError(error);
        reader.readAsBinaryString(file);
      }
    } catch (error) {
      handleError(error);
    }
  };

  const processData = (data: any[]) => {
    // Store data in local storage for use in other components
    try {
      const processedData = data.filter((row: any) => {
        return row.Particulars && (row.Debit || row.Credit);
      });
      
      localStorage.setItem('financialData', JSON.stringify(processedData));
      
      setIsUploading(false);
      toast({
        title: "Upload Successful",
        description: "Your data has been processed. You can now generate reports.",
      });
      
      // Navigate to reports page
      navigate('/reports');
    } catch (error) {
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
