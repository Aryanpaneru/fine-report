
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, FileSpreadsheet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface FinancialEntry {
  Particulars: string;
  Debit: number | string;
  Credit: number | string;
}

interface TrialBalance {
  [key: string]: {
    debit: number;
    credit: number;
  };
}

const Reports = () => {
  const [trialBalanceData, setTrialBalanceData] = useState<FinancialEntry[]>([]);
  const [profitLoss, setProfitLoss] = useState<{ incomes: any[], expenses: any[], netProfit: number }>({ 
    incomes: [], expenses: [], netProfit: 0 
  });
  const [balanceSheet, setBalanceSheet] = useState<{ 
    assets: any[], 
    liabilities: any[], 
    totalAssets: number, 
    totalLiabilities: number 
  }>({ 
    assets: [], liabilities: [], totalAssets: 0, totalLiabilities: 0 
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const data = localStorage.getItem('financialData');
    
    if (!data) {
      toast({
        title: "No Data Found",
        description: "Please upload a trial balance file first.",
        variant: "destructive",
      });
      navigate('/dashboard');
      return;
    }
    
    try {
      const parsedData = JSON.parse(data);
      console.log('Retrieved data from localStorage:', parsedData);
      setTrialBalanceData(parsedData);
      generateReports(parsedData);
    } catch (error) {
      console.error('Error parsing data:', error);
      toast({
        title: "Error",
        description: "Error processing the data. Please upload a valid file.",
        variant: "destructive",
      });
      navigate('/dashboard');
    }
  }, [navigate, toast]);

  const generateReports = (data: FinancialEntry[]) => {
    console.log('Generating reports with data:', data);
    
    // Categorize data for profit and loss and balance sheet
    const incomes: any[] = [];
    const expenses: any[] = [];
    const assets: any[] = [];
    const liabilities: any[] = [];
    
    // Define categorization rules based on account names
    const incomeAccounts = ['Sales', 'Commission Received', 'Discount', 'Dividend Received', 'Accrued Income'];
    const expenseAccounts = [
      'Trade Expenses', 'Salaries', 'Carriage Outwards', 'Rent', 'Purchases', 
      'Insurance', 'Carriage Inwards', 'Office Expenses', 'Electricity Charges',
      'Telephone Expenses', 'Printing & Stationery', 'Advertising', 'Interest Paid',
      'Depreciation', 'Bad Debts', 'Repairs & Maintenance', 'Miscellaneous Expenses',
      'Legal Fees', 'Audit Fees', 'Travelling Expenses', 'Wages'
    ];
    const assetAccounts = [
      'Sundry Debtors', 'Stock (01.01.2008)', 'Cash in Hand', 'Plant & Machinery',
      'Business Premises', 'Cash at Bank', 'Prepaid Insurance'
    ];
    const liabilityAccounts = [
      'Bank Overdraft', 'Sundry Creditors', 'Bills Payable', 'Capital',
      'Loan from Bank'
    ];

    // Process each entry and categorize
    data.forEach(entry => {
      console.log('Processing entry:', entry);
      
      // Ensure values are numbers
      const debit = parseFloat(entry.Debit as string) || 0;
      const credit = parseFloat(entry.Credit as string) || 0;
      
      if (typeof entry.Particulars !== 'string') {
        console.warn('Skipping entry with non-string Particulars:', entry);
        return;
      }
      
      const particulars = entry.Particulars.trim();
      
      if (incomeAccounts.some(account => particulars.includes(account))) {
        incomes.push({
          name: particulars,
          amount: credit || 0
        });
      } else if (expenseAccounts.some(account => particulars.includes(account))) {
        expenses.push({
          name: particulars,
          amount: debit || 0
        });
      } else if (assetAccounts.some(account => particulars.includes(account))) {
        assets.push({
          name: particulars,
          amount: debit || 0
        });
      } else if (liabilityAccounts.some(account => particulars.includes(account))) {
        liabilities.push({
          name: particulars,
          amount: credit || 0
        });
      } else {
        console.log('Uncategorized account:', particulars);
        // Try to intelligently categorize based on debit/credit values
        if (debit > 0 && credit === 0) {
          assets.push({
            name: particulars,
            amount: debit
          });
        } else if (credit > 0 && debit === 0) {
          liabilities.push({
            name: particulars,
            amount: credit
          });
        }
      }
    });

    console.log('Categorized data:');
    console.log('Incomes:', incomes);
    console.log('Expenses:', expenses);
    console.log('Assets:', assets);
    console.log('Liabilities:', liabilities);

    // Calculate totals
    const totalIncome = incomes.reduce((sum, item) => sum + item.amount, 0);
    const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);
    const netProfit = totalIncome - totalExpenses;
    
    if (netProfit > 0) {
      liabilities.push({
        name: 'Net Profit',
        amount: netProfit
      });
    } else if (netProfit < 0) {
      assets.push({
        name: 'Net Loss',
        amount: Math.abs(netProfit)
      });
    }
    
    const totalAssets = assets.reduce((sum, item) => sum + item.amount, 0);
    const totalLiabilities = liabilities.reduce((sum, item) => sum + item.amount, 0);

    // Set state for processed data
    setProfitLoss({
      incomes,
      expenses,
      netProfit
    });
    
    setBalanceSheet({
      assets,
      liabilities,
      totalAssets,
      totalLiabilities
    });

    // Store reports in localStorage for use in the View Reports page
    localStorage.setItem('profitLossReport', JSON.stringify({
      incomes,
      expenses,
      netProfit,
      totalIncome,
      totalExpenses
    }));
    
    localStorage.setItem('balanceSheetReport', JSON.stringify({
      assets,
      liabilities,
      totalAssets,
      totalLiabilities
    }));

    // Store data for ratios
    localStorage.setItem('ratiosData', JSON.stringify({
      sales: totalIncome,
      netProfit: netProfit,
      totalAssets: totalAssets,
      currentAssets: assets.filter(a => ['Sundry Debtors', 'Cash in Hand', 'Cash at Bank', 'Stock (01.01.2008)'].includes(a.name)).reduce((sum, a) => sum + a.amount, 0),
      currentLiabilities: liabilities.filter(l => ['Sundry Creditors', 'Bills Payable', 'Bank Overdraft'].includes(l.name)).reduce((sum, l) => sum + l.amount, 0),
      totalLiabilities: totalLiabilities - (liabilities.find(l => l.name === 'Capital')?.amount || 0) - (liabilities.find(l => l.name === 'Net Profit')?.amount || 0),
      equity: (liabilities.find(l => l.name === 'Capital')?.amount || 0) + (liabilities.find(l => l.name === 'Net Profit')?.amount || 0)
    }));
  };

  const downloadProfitLossReport = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text('Profit and Loss Statement', 105, 15, { align: 'center' });
    doc.setFontSize(12);
    doc.text('For the period ending 31 December 2023', 105, 22, { align: 'center' });
    
    // Add incomes
    doc.setFontSize(14);
    doc.text('Income', 14, 35);
    
    const incomeRows = profitLoss.incomes.map(income => [income.name, '', income.amount.toFixed(2)]);
    const totalIncome = profitLoss.incomes.reduce((sum, income) => sum + income.amount, 0);
    incomeRows.push(['Total Income', '', totalIncome.toFixed(2)]);
    
    (doc as any).autoTable({
      startY: 38,
      head: [['Particulars', '', 'Amount']],
      body: incomeRows,
      theme: 'grid',
      headStyles: { fillColor: [66, 66, 66] },
      foot: [['', '', '']],
      columnStyles: {
        0: { cellWidth: 100 },
        1: { cellWidth: 40 },
        2: { cellWidth: 40, halign: 'right' }
      }
    });
    
    // Add expenses
    const currentY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.text('Expenses', 14, currentY);
    
    const expenseRows = profitLoss.expenses.map(expense => [expense.name, '', expense.amount.toFixed(2)]);
    const totalExpenses = profitLoss.expenses.reduce((sum, expense) => sum + expense.amount, 0);
    expenseRows.push(['Total Expenses', '', totalExpenses.toFixed(2)]);
    
    (doc as any).autoTable({
      startY: currentY + 3,
      body: expenseRows,
      theme: 'grid',
      columnStyles: {
        0: { cellWidth: 100 },
        1: { cellWidth: 40 },
        2: { cellWidth: 40, halign: 'right' }
      }
    });
    
    // Add net profit/loss
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    if (profitLoss.netProfit >= 0) {
      doc.text(`Net Profit: ${profitLoss.netProfit.toFixed(2)}`, 14, finalY);
    } else {
      doc.text(`Net Loss: ${Math.abs(profitLoss.netProfit).toFixed(2)}`, 14, finalY);
    }
    
    doc.save('profit_loss_statement.pdf');
  };

  const downloadBalanceSheet = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text('Balance Sheet', 105, 15, { align: 'center' });
    doc.setFontSize(12);
    doc.text('As at 31 December 2023', 105, 22, { align: 'center' });
    
    // Add assets
    doc.setFontSize(14);
    doc.text('Assets', 14, 35);
    
    const assetRows = balanceSheet.assets.map(asset => [asset.name, '', asset.amount.toFixed(2)]);
    assetRows.push(['Total Assets', '', balanceSheet.totalAssets.toFixed(2)]);
    
    (doc as any).autoTable({
      startY: 38,
      head: [['Particulars', '', 'Amount']],
      body: assetRows,
      theme: 'grid',
      headStyles: { fillColor: [66, 66, 66] },
      columnStyles: {
        0: { cellWidth: 100 },
        1: { cellWidth: 40 },
        2: { cellWidth: 40, halign: 'right' }
      }
    });
    
    // Add liabilities
    const currentY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.text('Liabilities & Equity', 14, currentY);
    
    const liabilityRows = balanceSheet.liabilities.map(liability => [liability.name, '', liability.amount.toFixed(2)]);
    liabilityRows.push(['Total Liabilities & Equity', '', balanceSheet.totalLiabilities.toFixed(2)]);
    
    (doc as any).autoTable({
      startY: currentY + 3,
      body: liabilityRows,
      theme: 'grid',
      columnStyles: {
        0: { cellWidth: 100 },
        1: { cellWidth: 40 },
        2: { cellWidth: 40, halign: 'right' }
      }
    });
    
    doc.save('balance_sheet.pdf');
  };

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8 text-center">Financial Reports</h1>
      
      <Tabs defaultValue="profit-loss">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="profit-loss">Profit & Loss Statement</TabsTrigger>
          <TabsTrigger value="balance-sheet">Balance Sheet</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profit-loss">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileSpreadsheet className="mr-2 h-5 w-5" />
                Profit & Loss Statement
              </CardTitle>
              <CardDescription>
                Financial performance for the period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Income</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Particulars</th>
                          <th className="text-right p-2">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {profitLoss.incomes.map((income, index) => (
                          <tr key={index} className="border-b">
                            <td className="p-2">{income.name}</td>
                            <td className="text-right p-2">{income.amount.toFixed(2)}</td>
                          </tr>
                        ))}
                        <tr className="font-semibold">
                          <td className="p-2">Total Income</td>
                          <td className="text-right p-2">
                            {profitLoss.incomes.reduce((sum, income) => sum + income.amount, 0).toFixed(2)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-2">Expenses</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Particulars</th>
                          <th className="text-right p-2">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {profitLoss.expenses.map((expense, index) => (
                          <tr key={index} className="border-b">
                            <td className="p-2">{expense.name}</td>
                            <td className="text-right p-2">{expense.amount.toFixed(2)}</td>
                          </tr>
                        ))}
                        <tr className="font-semibold">
                          <td className="p-2">Total Expenses</td>
                          <td className="text-right p-2">
                            {profitLoss.expenses.reduce((sum, expense) => sum + expense.amount, 0).toFixed(2)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Net {profitLoss.netProfit >= 0 ? 'Profit' : 'Loss'}</span>
                    <span>{Math.abs(profitLoss.netProfit).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button variant="outline" onClick={downloadProfitLossReport}>
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="balance-sheet">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileSpreadsheet className="mr-2 h-5 w-5" />
                Balance Sheet
              </CardTitle>
              <CardDescription>
                Financial position as of the end of period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Assets</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Particulars</th>
                          <th className="text-right p-2">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {balanceSheet.assets.map((asset, index) => (
                          <tr key={index} className="border-b">
                            <td className="p-2">{asset.name}</td>
                            <td className="text-right p-2">{asset.amount.toFixed(2)}</td>
                          </tr>
                        ))}
                        <tr className="font-semibold">
                          <td className="p-2">Total Assets</td>
                          <td className="text-right p-2">
                            {balanceSheet.totalAssets.toFixed(2)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-2">Liabilities & Equity</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Particulars</th>
                          <th className="text-right p-2">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {balanceSheet.liabilities.map((liability, index) => (
                          <tr key={index} className="border-b">
                            <td className="p-2">{liability.name}</td>
                            <td className="text-right p-2">{liability.amount.toFixed(2)}</td>
                          </tr>
                        ))}
                        <tr className="font-semibold">
                          <td className="p-2">Total Liabilities & Equity</td>
                          <td className="text-right p-2">
                            {balanceSheet.totalLiabilities.toFixed(2)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button variant="outline" onClick={downloadBalanceSheet}>
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;
