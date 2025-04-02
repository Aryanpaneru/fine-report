
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const FormatExample = () => {
  return (
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
  );
};

export default FormatExample;
