# Product Requirements Document (PRD)

## Product Name

**Genius Board (CSV-based Sales Data Analysis)**

## Version

v1.0

## Author

Shoon Lai

## Date

2026-01-06

---

## 1. Overview

This product is a web-based Sales Data Analysis Dashboard that allows users to upload a CSV sales dataset and instantly view, filter, analyze, and visualize the data. All dashboards, tables, and metrics must dynamically adapt to the uploaded CSV structure (column-based).

> 👉 **Myanmar Note:** User တင်လိုက်တဲ့ CSV file ကို အခြေခံပြီး dashboard, filter, analysis အားလုံး auto generate ဖြစ်ရပါမယ်။

---

## 2. Goals & Objectives

### Goals

- Enable non-technical users to analyze sales data easily
- Ensure 100% data consistency between CSV, filters, and dashboard
- Support dynamic column-based filtering
- Provide bilingual UI (Myanmar / English)

### Objectives

- Upload CSV → View raw data → Filter → Analyze → Visualize
- Date-based & column-based filtering
- Accurate KPIs synced with filters

---

## 3. Target Users

- Business Owners
- Sales Managers
- Data Analysts (basic/intermediate)
- SMEs using CSV-based sales records

---

## 4. Supported File Format

- CSV (.csv) only (v1)
- UTF-8 encoding
- Header row required

---

## 5. User Flow

1. User opens website
2. Uploads CSV file
3. System reads column names automatically
4. Raw CSV table is displayed
5. Filters are auto-generated from column names
6. User applies filters (column/date/value)
7. Dashboard KPIs & charts update instantly
8. User switches language (MM / EN) if needed

---

## 6. Core Functional Requirements

### 6.1 CSV Upload Module

- Drag & Drop upload
- File validation (CSV only)
- Error handling (invalid format, empty file)
- Preview first N rows

---

### 6.2 Dynamic Column Detection

- Auto-detect all column names
- Identify data types:
  - Date
  - Number
  - Text

**Example Columns:**

- Date
- Customer
- Product
- Quantity
- Unit Price
- Total Amount

---

### 6.3 Raw CSV Table View

- Display full CSV data in table
- Pagination & search
- Sort ascending/descending
- Column reordering

> **Requirement:** If user selects "Customer" filter, Customer column must appear first in the table.

---

### 6.4 Filtering System (Dynamic)

#### Column-Based Filters

- Dropdown list of all column names
- Filter types auto-adjust based on data type

**Examples:**

- Text → contains / equals
- Number → min / max
- Category → multi-select

#### Date Filter

- Date range picker (From – To)
- Auto-detected date columns

#### Global Filter Rules

- Multiple filters can be applied together
- Filters affect:
  - Table
  - KPIs
  - Charts

---

### 6.5 Dashboard KPIs (Auto-calculated)

Dashboard values must always match filtered CSV data.

**Default KPIs:**

- Total Sales Amount
- Total Orders (row count)
- Total Quantity Sold
- Average Order Value
- Unique Customers

**All KPIs recalculate on:**

- Filter change
- Date range change

---

### 6.6 Data Visualization (Charts)

Dynamic charts based on detected columns:

- **Line Chart:** Sales over Time (Date-based)
- **Bar Chart:** Sales by Product / Customer
- **Pie Chart:** Revenue distribution
- **Table Summary:** Group By selected column

**Rules:**

- Charts update in real-time with filters
- User can select which column to visualize

---

### 6.7 Language Switch (Myanmar / English)

- Toggle button (MM | EN)
- Affects:
  - UI labels
  - Buttons
  - Messages

> **Note:** CSV data values remain unchanged

---

### 6.8 Data Consistency Rules (Critical)

✅ **Mandatory Rules:**

- Dashboard metrics = Filtered CSV data
- Charts = Filtered CSV data
- Table = Filtered CSV data

❌ **No cached or pre-calculated mismatch allowed**

---

### 6.9 Export & Download

- Export filtered data as CSV
- Export dashboard summary as:
  - PDF (optional phase)
  - Image (optional phase)

---

## 7. Non-Functional Requirements

### Performance

- Handle up to 100k rows smoothly
- Filter response < 1 second

### Security

- No data stored permanently (session-based)
- HTTPS required

### Compatibility

- Desktop & Tablet responsive
- Chrome, Edge, Firefox

---

## 8. UI / UX Requirements

- Clean dashboard layout
  - **Left:** Filters panel
  - **Center:** Charts & KPIs
  - **Bottom:** CSV table

### UX Principles:

- No-code usage
- Clear empty states
- Loading indicators

---

## 9. Error Handling

- Invalid CSV structure
- Missing header row
- Unsupported data types
- Friendly bilingual error messages

---

## 10. Assumptions & Constraints

### Assumptions:

- CSV column names are meaningful
- Date format is consistent

### Constraints:

- No database persistence (v1)
- CSV only (no Excel in v1)

---

## 11. Future Enhancements (Phase 2)

- Excel (.xlsx) support
- Saved dashboards
- User accounts
- AI-based insights
- Auto anomaly detection

---

## 12. Success Metrics

- CSV upload success rate
- Filter accuracy (no mismatch)
- Dashboard load time
- User satisfaction

---

## 13. Approval

**Stakeholders:**

- Product Owner
- Tech Lead
- Business Owner

---

## Tech Stack

| Technology       | Purpose                         |
| ---------------- | ------------------------------- |
| **Next.js**      | React framework with App Router |
| **TypeScript**   | Type safety                     |
| **Tailwind CSS** | Utility-first styling           |
| **shadcn/ui**    | UI component library            |
| **Supabase**     | PostgreSQL database + Real-time |
| **Prisma ORM**   | Database ORM                    |
