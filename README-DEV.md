
# Financial Analyzer - Developer Guide

This document provides technical information for developers working on the Financial Analyzer project.

## Project Overview

Financial Analyzer is a React application built with TypeScript that allows users to upload, parse, and analyze financial data to generate various reports.

## Tech Stack

- **React** - Frontend library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI component library
- **Vite** - Build tool
- **PapaParse** - CSV parsing
- **XLSX** - Excel file parsing
- **jsPDF** - PDF generation
- **Recharts** - Data visualization

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`

## Project Structure

```
src/
├── components/          # UI components
│   ├── dashboard/       # Dashboard-related components
│   ├── reports/         # Report components
│   ├── charts/          # Data visualization components
│   └── ui/              # Reusable UI components
├── hooks/               # Custom React hooks
├── lib/                 # Utility libraries
├── pages/               # Page components
└── utils/               # Utility functions
    ├── fileParser/      # File parsing modules
    ├── pdfExporter.ts   # PDF export functionality
    └── reportGenerator.ts # Report generation logic
```

## Key Features

### File Parser Module

The file parser module (`src/utils/fileParser/`) is responsible for parsing financial data from CSV and Excel files. It's designed with a modular architecture:

- **index.ts**: Main entry point with the public API
- **types.ts**: Type definitions
- **normalize.ts**: Column name normalization
- **validator.ts**: Data validation
- **processor.ts**: Data processing
- **csvParser.ts**: CSV-specific parsing
- **excelParser.ts**: Excel-specific parsing

### Report Generation

The report generation functionality (`src/utils/reportGenerator.ts`) processes the parsed financial data to generate:

- Profit & Loss Statement
- Balance Sheet
- Financial Ratios

### Authentication

The application uses a simple authentication system with local storage. In a production environment, this should be replaced with a more secure solution.

## Development Workflow

1. **Feature Development**: Create a new branch for each feature
2. **Testing**: Test new features thoroughly
3. **Code Review**: Submit a pull request for code review
4. **Merge**: Merge approved changes to the main branch

## Common Development Tasks

### Adding a New Component

1. Create a new file in the appropriate components directory
2. Define the component with TypeScript types
3. Export the component
4. Import and use it where needed

### Adding a New Utility Function

1. Identify the appropriate utility file or create a new one
2. Add the function with TypeScript types
3. Export the function
4. Import and use it where needed

## Best Practices

1. **Type Safety**: Use TypeScript types for all functions and components
2. **Modular Design**: Keep components and functions small and focused
3. **Error Handling**: Implement proper error handling for all operations
4. **Comments**: Document complex logic with comments
5. **Testing**: Write tests for critical functionality

## Deployment

The application is built using Vite and can be deployed to any static hosting service:

1. Build the application: `npm run build`
2. Deploy the contents of the `dist` directory to your hosting service

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

[Specify the license information here]
