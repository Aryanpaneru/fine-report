
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import FileUploader from './dashboard/FileUploader';
import FormatExample from './dashboard/FormatExample';
import { parseFinancialFile, processFinancialData, validateFinancialData } from '@/utils/fileParser';

const Dashboard = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    // Clear previous errors when a new file is selected
    setValidationError(null);
  };

  const handleError = (error: any) => {
    console.error('Error processing file:', error);
    setIsUploading(false);
    setValidationError(error.message || 'There was an issue processing your file. Please check the format and try again.');
    toast({
      title: "Error Processing File",
      description: error.message || "There was an issue processing your file. Please check the format and try again.",
      variant: "destructive",
    });
  };

  const parseFile = () => {
    if (!file) return;
    
    setIsUploading(true);
    setValidationError(null);
    
    parseFinancialFile(
      file,
      (data) => {
        try {
          const processedData = processFinancialData(data);
          
          if (processedData.length === 0) {
            const errorMessage = 'The file does not contain any valid financial data. Please check the format.';
            setValidationError(errorMessage);
            toast({
              title: "No Valid Data",
              description: errorMessage,
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
      },
      handleError
    );
  };

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8 text-center">Financial Data Upload</h1>
      
      {validationError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{validationError}</AlertDescription>
        </Alert>
      )}
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Upload Trial Balance</CardTitle>
          <CardDescription>
            Upload your trial balance in CSV or Excel format to generate financial reports and analyze key ratios.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FileUploader onFileSelect={handleFileSelect} />
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
        <FormatExample />
      </div>
    </div>
  );
};

export default Dashboard;
