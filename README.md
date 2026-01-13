# 📊 Sales Data Analysis Dashboard

A powerful, full-featured web-based **Sales Data Analysis Dashboard** that enables users to upload CSV sales datasets and instantly view, filter, analyze, and visualize their data with dynamic, column-based insights. Built with **Next.js 16**, **TypeScript**, and **PostgreSQL**.

![Next.js](https://img.shields.io/badge/Next.js-16.1.1-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-336791?logo=postgresql)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?logo=tailwind-css)
![Prisma](https://img.shields.io/badge/Prisma-7.2-2D3748?logo=prisma)

---

## ✨ Features

### 📤 CSV Upload & Dynamic Processing

- **Drag & Drop Upload** - Intuitive file upload with visual feedback
- **Auto Column Detection** - Automatically identifies column names and data types (Date, Number, Text)
- **CSV Validation** - File format validation with friendly error messages
- **Preview Mode** - View first N rows before full analysis

### 🔍 Dynamic Filtering System

- **Column-Based Filters** - Auto-generated filters based on detected column types
- **Date Range Picker** - Filter data by custom date ranges
- **Multi-Select Categories** - Filter by multiple category values
- **Text Search** - Contains/equals filtering for text columns
- **Number Range** - Min/max filtering for numeric columns
- **Real-time Updates** - All filters update Table, KPIs, and Charts instantly

### 📈 Dashboard KPIs (Auto-calculated)

- **Total Sales Amount** - Sum of all sales revenue
- **Total Orders** - Count of all order rows
- **Total Quantity Sold** - Sum of all quantities
- **Average Order Value** - Mean transaction value
- **Unique Customers** - Distinct customer count

All KPIs dynamically recalculate when filters change to ensure 100% data consistency.

### 📊 Data Visualizations

- **Line Chart** - Sales trends over time
- **Bar Chart** - Sales by Product/Customer comparison
- **Pie Chart** - Revenue distribution breakdown
- **Interactive Charts** - Powered by Recharts library
- **Column Selection** - Choose which columns to visualize

### 📋 Data Table

- **Full CSV Display** - View all uploaded data
- **Excel-like CRUD Operations** - Create, Read, Update, Delete rows directly in table
- **Inline Editing** - Click to edit cells
- **Pagination & Search** - Navigate large datasets efficiently
- **Sorting** - Ascending/descending by any column
- **Column Reordering** - Selected filter column appears first

### 🌍 Bilingual Support (Myanmar / English)

- **Language Toggle** - Switch between MM and EN
- **Full UI Translation** - All labels, buttons, and messages translated
- **Data Preservation** - CSV data values remain unchanged

### 🔐 Authentication & Admin Panel

- **Role-based Access Control** - Separate admin and user interfaces
- **User Management** - Admin CRUD operations for users
- **Secure Authentication** - JWT tokens with bcrypt password hashing
- **Dashboard History** - Save and reload previous analysis sessions

### 💾 Data Persistence

- **Session Management** - Upload sessions stored in database
- **Saved Dashboards** - Save filter and chart configurations
- **Auto-cleanup** - Expired sessions automatically removed

---

## 🛠️ Tech Stack

| Technology         | Purpose                         |
| ------------------ | ------------------------------- |
| **Next.js 16**     | React framework with App Router |
| **TypeScript**     | Type-safe development           |
| **Tailwind CSS 4** | Utility-first styling           |
| **shadcn/ui**      | Premium UI component library    |
| **Supabase**       | PostgreSQL database + Real-time |
| **Prisma ORM 7**   | Type-safe database access       |
| **Recharts**       | Data visualization library      |
| **PapaParse**      | Robust CSV parsing              |
| **TanStack Table** | Powerful table component        |
| **Jose**           | JWT token handling              |
| **bcryptjs**       | Password hashing                |

---

## 📁 Project Structure

```
sale-data-analysis-dashboard/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Home page (Upload)
│   │   ├── dashboard/          # Dashboard routes
│   │   ├── admin/              # Admin panel routes
│   │   └── api/                # API routes
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── csv/                # CSV-related components
│   │   ├── dashboard/          # Dashboard components
│   │   ├── filters/            # Filter components
│   │   └── charts/             # Chart components
│   ├── context/                # React Context providers
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Utility functions
│   ├── types/                  # TypeScript type definitions
│   └── locales/                # i18n translation files
├── prisma/
│   └── schema.prisma           # Database schema
├── public/                     # Static assets
├── PRD.md                      # Product Requirements Document
└── CLAUDE.md                   # Development guidelines
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (or Supabase account)
- npm, yarn, or pnpm

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/Kcubez/sale-data-analysis-dashboard.git
   cd sale-data-analysis-dashboard
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   ```

   Configure your `.env` file:

   ```env
   DATABASE_URL="postgresql://..."
   DIRECT_URL="postgresql://..."
   NEXT_PUBLIC_SUPABASE_URL="https://..."
   NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
   JWT_SECRET="your-secret-key"
   ```

4. **Generate Prisma client and sync database**

   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the development server**

   ```bash
   npm run dev
   ```

6. **Open in browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

---

## 📝 Usage

1. **Upload CSV** - Drag and drop or click to upload your sales CSV file
2. **Review Data** - Preview the raw data table and detected columns
3. **Apply Filters** - Use auto-generated filters to narrow down data
4. **Analyze KPIs** - View dynamically calculated metrics
5. **Visualize** - Explore data through interactive charts
6. **Edit Data** - Make inline edits to table cells (CRUD operations)
7. **Export** - Download filtered data as CSV
8. **Switch Language** - Toggle between Myanmar and English

---

## 🔧 Available Scripts

```bash
# Development
npm run dev         # Start development server

# Production
npm run build       # Build for production
npm run start       # Start production server

# Database
npx prisma generate # Generate Prisma client
npx prisma db push  # Sync database schema
npx prisma studio   # Open database GUI

# Linting
npm run lint        # Run ESLint
```

---

## 🎯 Key Requirements (Data Consistency)

✅ **Dashboard metrics = Filtered CSV data**  
✅ **Charts = Filtered CSV data**  
✅ **Table = Filtered CSV data**

❌ **No cached or pre-calculated mismatch allowed**

---

## 🔮 Future Enhancements (Phase 2)

- [ ] Excel (.xlsx) support
- [ ] AI-based insights using Google Gemini
- [ ] Auto anomaly detection
- [ ] Collaborative dashboards
- [ ] Custom chart builder
- [ ] Scheduled report exports

---

## 📄 License

This project is private and proprietary.

---

## 👤 Author

**Kaung Khant Kyaw**  
Full Stack Developer

- GitHub: [@Kcubez](https://github.com/Kcubez)
- LinkedIn: [Kaung Khant Kyaw](https://www.linkedin.com/in/kaung-khant-kyaw-k/)

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React Framework
- [shadcn/ui](https://ui.shadcn.com/) - Beautiful UI components
- [Supabase](https://supabase.com/) - The Open Source Firebase Alternative
- [Recharts](https://recharts.org/) - Composable charting library
