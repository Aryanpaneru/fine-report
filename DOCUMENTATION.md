
# Financial Analyzer Documentation

## Overview

Financial Analyzer is a web application designed to help users analyze financial data. It allows users to upload trial balance data in CSV or Excel format, process it, and generate various financial reports, including profit and loss statements, balance sheets, and key financial ratios.

## Table of Contents

- [Features](#features)
- [Project Structure](#project-structure)
- [File Upload and Parsing](#file-upload-and-parsing)
- [Data Cleanup](#data-cleanup)
- [Report Generation](#report-generation)
- [Data Requirements](#data-requirements)
- [Authentication](#authentication)
- [Troubleshooting](#troubleshooting)
- [Technical Implementation Details](#technical-implementation-details)

## Features

- **User Authentication**: Secure login system to protect user data.
- **File Upload**: Supports CSV and Excel files (XLSX, XLS, ODS) containing financial data.
- **Data Validation**: Comprehensive validation of uploaded financial data.
- **Data Cleanup**: Tool to convert various data formats into the application's standard format.
- **Financial Reports**:
  - Profit & Loss Statement
  - Balance Sheet
  - Financial Ratios
- **Visualization**: Visual representation of financial data using charts.
- **Export Functionality**: Reports can be exported in PDF and Word formats.
- **Dark/Light Mode**: Toggle between dark and light display themes.

## Project Structure

The application is built using React, TypeScript, and various supporting libraries. The folder structure is as follows:

- **src/components/**: UI components of the application
  - **dashboard/**: Components related to the dashboard page
  - **reports/**: Components for displaying financial reports
  - **charts/**: Chart components for data visualization
  - **ui/**: Reusable UI components (buttons, cards, etc.)
- **src/utils/**: Utility functions
  - **fileParser/**: Modules for parsing uploaded files
  - **reportGenerator.ts**: Functions for generating financial reports
  - **pdfExporter.ts**: Functions for exporting reports to PDF
  - **wordExporter.ts**: Functions for exporting reports to Word
- **src/pages/**: Main page components
- **src/hooks/**: Custom React hooks

## File Upload and Parsing

### Supported File Formats

The application supports the following file formats:

- CSV (.csv)
- Excel (.xlsx, .xls)
- OpenDocument Spreadsheet (.ods)

### File Structure Requirements

Uploaded files must contain the following columns:

- **Particulars**: Account names (e.g., "Sales", "Purchases", "Capital")
- **Debit**: Debit amounts in numeric format
- **Credit**: Credit amounts in numeric format

### Parsing Process

1. **File Format Detection**: Determines if the file is CSV or Excel format.
2. **Raw Data Extraction**: Extracts data from the file.
3. **Column Normalization**: Standardizes column names (case-insensitive).
4. **Data Validation**: Validates the structure and content of the data.
5. **Data Processing**: Processes and normalizes the financial data.
6. **Error Handling**: Identifies and reports issues with the file or data.

## Data Cleanup

The Data Cleanup tool helps users convert their financial data from various formats into the application's standard format.

### Features

- **Automatic Column Identification**: Recognizes common column names and variations.
- **Format Conversion**: Converts data with different structures to the standard Particulars-Debit-Credit format.
- **Preview**: Shows a preview of the converted data before download.
- **Export**: Allows downloading the cleaned data in Excel format for later use.

### Using the Data Cleanup Tool

1. Navigate to the Data Cleanup page from the main menu.
2. Upload your financial data file (CSV, Excel).
3. Click "Process & Convert" to analyze and convert your data.
4. Review the preview of your converted data.
5. Click "Download" to save the formatted data to your computer.
6. Use the downloaded file when uploading data for analysis.

## Report Generation

### Profit & Loss Statement

This report shows the financial performance over a period, including:

- Income items
- Expense items
- Net profit or loss

### Balance Sheet

This report displays the financial position, including:

- Assets
- Liabilities & Equity
- Balance verification (Total Assets = Total Liabilities + Equity)

### Financial Ratios

Various financial ratios are calculated to provide insights into the financial health of an entity:

- Liquidity Ratios
- Profitability Ratios
- Solvency Ratios
- Efficiency Ratios

## Data Requirements

For accurate financial analysis, it is recommended to upload a complete trial balance containing all accounts and their balances.

### Common Account Classifications

The application categorizes accounts as follows:

- **Assets**: Cash, Accounts Receivable, Inventory, Fixed Assets, etc.
- **Liabilities**: Accounts Payable, Loans, Notes Payable, etc.
- **Equity**: Capital, Retained Earnings, etc.
- **Income**: Sales, Service Revenue, Interest Income, etc.
- **Expenses**: Cost of Goods Sold, Salaries, Rent, Utilities, etc.

## Authentication

The application uses a simple authentication system where user credentials are stored in local storage. In a production environment, this should be replaced with a more secure authentication method.

## Troubleshooting

### File Upload Issues

- Ensure the file format is supported (CSV, XLSX, XLS, ODS).
- Check that the file contains the required columns (Particulars, Debit, Credit).
- Verify that numeric values are properly formatted.
- Large files may take longer to process.
- Try using the Data Cleanup tool to format your data before analysis.

### Data Validation Errors

If you encounter validation errors:

- Check the audit report for specific issues.
- Ensure all account names are in the Particulars column.
- Verify that Debit and Credit values are numeric.
- Make sure there are no merged cells in Excel files.

### Report Generation Issues

If reports don't generate correctly:

- Ensure the trial balance data is complete and balanced.
- Check that accounts are properly categorized.
- Verify that all required accounts for financial analysis are present.

## Technical Implementation Details

### File Parsing Architecture

The file parsing functionality is implemented using a modular approach:

- **index.ts**: Main entry point and public API
- **types.ts**: Type definitions and interfaces
- **normalize.ts**: Column name normalization utilities
- **validator.ts**: Data validation logic
- **processor.ts**: Data processing utilities
- **csvParser.ts**: CSV-specific parsing logic
- **excelParser.ts**: Excel-specific parsing logic

This modular design improves maintainability and allows for easier updates and extensions.

### Report Generation Architecture

The report generation process follows these steps:

1. Parses the trial balance data
2. Categorizes accounts by type (asset, liability, equity, income, expense)
3. Calculates totals for each category
4. Computes the net profit or loss
5. Generates the balance sheet and profit & loss statement
6. Calculates financial ratios

### Data Flow

1. User uploads a file through the FileUploader component.
2. The file is passed to parseFinancialFile in fileParser/index.ts.
3. Based on file type, either parseCSVFile or parseExcelFile is called.
4. Parsed data is validated using validateFinancialData.
5. Valid data is processed with processFinancialData.
6. Processed data is stored in localStorage.
7. Reports are generated using functions from reportGenerator.ts.
8. Reports can be viewed and exported to PDF using pdfExporter.ts or to Word using wordExporter.ts.
