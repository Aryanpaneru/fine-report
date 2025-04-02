
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const FormatExample = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Expected Format</CardTitle>
        <CardDescription>
          Your file should contain the following columns: Particulars, Debit, Credit
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="example">
          <TabsList className="mb-4">
            <TabsTrigger value="example">Example Data</TabsTrigger>
            <TabsTrigger value="requirements">Requirements</TabsTrigger>
          </TabsList>
          
          <TabsContent value="example">
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
          </TabsContent>
          
          <TabsContent value="requirements">
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">File Format Requirements:</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>CSV, XLSX, XLS, or ODS file formats are supported</li>
                  <li>The file must contain a header row with the column names</li>
                  <li>Required columns are: <code>Particulars</code>, <code>Debit</code>, and <code>Credit</code> (case insensitive)</li>
                  <li>Each row must contain the account name in the Particulars column</li>
                  <li>Each row must have either a Debit or Credit value (or both)</li>
                  <li>Empty rows will be ignored</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Account Types:</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Income accounts:</strong> Sales, Commission Received, Discount, Dividend Received, etc.</li>
                  <li><strong>Expense accounts:</strong> Purchases, Salaries, Rent, Insurance, etc.</li>
                  <li><strong>Asset accounts:</strong> Cash, Bank, Stock, Debtors, etc.</li>
                  <li><strong>Liability accounts:</strong> Capital, Loans, Creditors, etc.</li>
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default FormatExample;
