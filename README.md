# Excel Analysis Platform

A modern, full-stack web application for uploading, parsing, and visualizing Excel data with interactive charts and comprehensive analytics.

## 🚀 Features

### Core Functionality
- **Excel File Upload & Parsing**: Upload Excel files (.xlsx, .xls) with automatic parsing using SheetJS
- **Multi-Sheet Support**: Handle Excel files with multiple sheets
- **Real-time Data Processing**: Extract column headers, row counts, and sample data
- **Interactive Chart Generation**: Create various chart types from Excel data

### Chart Types Supported
- **Bar Charts**: Perfect for comparing categories
- **Line Charts**: Ideal for showing trends over time
- **Pie Charts**: Great for showing proportions
- **Doughnut Charts**: Alternative to pie charts with center space
- **Scatter Plots**: Excellent for correlation analysis

### Advanced Features
- **Column Selection**: Choose X and Y axes from your Excel data
- **Chart History**: View and reuse previously created charts
- **Download Options**: Export charts as PNG images, PDF reports, and CSV data
- **Real-time Dashboard**: Live statistics and activity tracking
- **User Management**: Complete user authentication and authorization

### Export & Download Features
- **PNG Export**: Download charts as high-quality PNG images
- **PDF Reports**: Generate comprehensive PDF reports with charts, statistics, and analysis
- **Full Analysis PDF**: Create detailed reports including chart history, data insights, and statistical analysis
- **CSV Export**: Export chart data as CSV files for further analysis
- **Professional Formatting**: Beautiful, well-formatted PDF reports with proper styling

### File Management Features
- **Multi-Select File Management**: Select multiple files for bulk operations
- **Bulk Delete**: Delete multiple files simultaneously with confirmation
- **File Selection Mode**: Toggle between normal and selection modes
- **Keyboard Shortcuts**: Use Escape key to exit selection mode
- **Visual Feedback**: Selected files are highlighted with blue border
- **Smart Selection**: Select all/deselect all functionality
- **File Statistics**: View file count, rows, columns, and upload dates

### Admin Features
- **Admin Dashboard**: Comprehensive platform analytics
- **User Management**: Block/unblock users, delete accounts
- **Platform Statistics**: Track usage, popular chart types, user activity
- **Activity Monitoring**: Real-time platform activity feed

## 🛠️ Technology Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **SheetJS (xlsx)** for Excel parsing
- **JWT** for authentication
- **bcryptjs** for password hashing
- **Multer** for file uploads

### Frontend
- **React.js** with functional components and hooks
- **Redux Toolkit** for state management
- **Chart.js** with react-chartjs-2 for data visualization
- **jsPDF** for PDF generation
- **Tailwind CSS** for styling
- **Axios** for API communication

## 📊 PDF Report Features

### Standard PDF Report
- File information and metadata
- Chart visualization with proper sizing
- File statistics (rows, columns, sheets)
- Data summary with key metrics
- Professional formatting and styling

### Comprehensive Analysis Report
- Title page with platform branding
- Detailed file information and statistics
- Current chart analysis with visualization
- Statistical analysis (mean, median, min, max, range)
- Chart history and previous analyses
- Data insights and interpretation
- Multi-page support for large reports

### CSV Export
- Export chart data as CSV files
- Proper formatting with headers
- Compatible with Excel and other spreadsheet applications

## 📁 File Management

### Multi-Select Operations
1. **Enter Selection Mode**: Click "Select Files" button
2. **Select Files**: Use checkboxes to select individual files
3. **Bulk Operations**: 
   - Use "Select All" to select all files
   - Use "Deselect All" to clear selection
4. **Delete Files**: Click "Delete" button to remove selected files
5. **Exit Mode**: Click "Cancel" or press Escape key

### File Operations
- **View Files**: See all uploaded files with metadata
- **Analyze Files**: Click "Analyze" to create charts
- **Delete Files**: Remove files with confirmation dialog
- **File Information**: View rows, columns, and upload dates

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Excel-Analysis-Platform
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Set up environment variables**
   Create a `.env` file in the backend directory:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   PORT=5000
   ```

5. **Start the backend server**
   ```bash
   cd backend
   npm run dev
   ```

6. **Start the frontend development server**
   ```bash
   cd frontend
   npm run dev
   ```

7. **Access the application**
   Open your browser and navigate to `http://localhost:5173`

## 📖 Usage

### Uploading Excel Files
1. Navigate to the Upload page
2. Drag and drop or select an Excel file (.xlsx or .xls)
3. Wait for the file to be processed
4. Click "Analyze Data" to proceed to analysis

### Creating Charts
1. Select the desired chart type (Bar, Line, Pie, Doughnut, Scatter)
2. Choose X and Y axes from your data columns
3. Click "Generate Chart" to create the visualization
4. Use the download options to export your analysis

### Managing Files
1. **View Files**: Go to the Home dashboard to see all uploaded files
2. **Select Files**: Click "Select Files" to enter selection mode
3. **Bulk Delete**: Select multiple files and click "Delete"
4. **Analyze Files**: Click "Analyze" on individual files

### Exporting Reports
- **PNG**: Quick download of the chart as an image
- **PDF Report**: Standard report with chart and basic statistics
- **Full Analysis**: Comprehensive report with detailed analysis and insights
- **CSV Export**: Raw data export for further processing

## 🔧 API Endpoints

### Analysis Routes
- `POST /api/analysis/chart` - Generate chart data
- `GET /api/analysis/file/:fileId/charts` - Get chart history
- `GET /api/analysis/pdf-data/:fileId` - Get comprehensive data for PDF generation
- `POST /api/analysis/save-chart` - Save chart analysis

### Upload Routes
- `POST /api/upload/excel` - Upload Excel file
- `GET /api/upload/file/:fileId` - Get file data
- `GET /api/upload/files` - Get all user files
- `DELETE /api/upload/file/:fileId` - Delete a file

### Dashboard Routes
- `GET /api/dashboard/stats` - Get user dashboard statistics
- `GET /api/dashboard/files` - Get user files

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions, please:
1. Check the existing issues
2. Create a new issue with detailed information
3. Include error messages and steps to reproduce

## 🔮 Future Enhancements

- [ ] Real-time collaboration features
- [ ] Advanced statistical analysis
- [ ] Machine learning insights
- [ ] Custom chart themes
- [ ] Bulk file processing
- [ ] API rate limiting
- [ ] Advanced user roles and permissions
- [ ] File sharing between users
- [ ] File versioning and history
- [ ] Advanced file search and filtering

```

