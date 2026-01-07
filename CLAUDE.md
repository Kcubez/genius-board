# CLAUDE.md - Sales Data Analysis Dashboard

## Project Overview

This is a **Sales Data Analysis Dashboard** built with Next.js that allows users to upload CSV files and analyze sales data with dynamic filtering, KPIs, and visualizations. The dashboard supports bilingual UI (Myanmar/English).

---

## Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **Database:** Supabase (PostgreSQL)
- **ORM:** Prisma

---

## Project Structure

```
sale-data-analysis-dashboard/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Home page (Upload)
│   │   ├── dashboard/          # Dashboard routes
│   │   │   └── page.tsx
│   │   └── api/                # API routes
│   │       ├── upload/         # CSV upload endpoint
│   │       ├── analyze/        # Data analysis endpoint
│   │       └── export/         # Export endpoint
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── csv/                # CSV-related components
│   │   │   ├── CsvUploader.tsx
│   │   │   ├── CsvTable.tsx
│   │   │   └── CsvPreview.tsx
│   │   ├── dashboard/          # Dashboard components
│   │   │   ├── KpiCards.tsx
│   │   │   ├── ChartContainer.tsx
│   │   │   └── FilterPanel.tsx
│   │   ├── filters/            # Filter components
│   │   │   ├── DateRangeFilter.tsx
│   │   │   ├── TextFilter.tsx
│   │   │   ├── NumberFilter.tsx
│   │   │   └── CategoryFilter.tsx
│   │   └── charts/             # Chart components
│   │       ├── LineChart.tsx
│   │       ├── BarChart.tsx
│   │       └── PieChart.tsx
│   ├── lib/
│   │   ├── prisma.ts           # Prisma client
│   │   ├── supabase.ts         # Supabase client
│   │   ├── csv-parser.ts       # CSV parsing utilities
│   │   ├── data-detector.ts    # Column type detection
│   │   └── i18n.ts             # Internationalization
│   ├── hooks/
│   │   ├── useCsvData.ts       # CSV data hook
│   │   ├── useFilters.ts       # Filter state hook
│   │   └── useLanguage.ts      # Language switch hook
│   ├── types/
│   │   ├── csv.ts              # CSV-related types
│   │   ├── filter.ts           # Filter types
│   │   └── dashboard.ts        # Dashboard types
│   ├── context/
│   │   ├── CsvContext.tsx      # CSV data context
│   │   ├── FilterContext.tsx   # Filter context
│   │   └── LanguageContext.tsx # Language context
│   └── locales/
│       ├── en.json             # English translations
│       └── mm.json             # Myanmar translations
├── prisma/
│   └── schema.prisma           # Database schema
├── public/
│   └── locales/                # Static locale files
├── PRD.md                      # Product Requirements
├── CLAUDE.md                   # This file
├── package.json
├── tailwind.config.ts
├── next.config.js
└── tsconfig.json
```

---

## Implementation Plan

### Phase 1: Project Setup

1. Initialize Next.js with TypeScript
2. Configure Tailwind CSS
3. Install and configure shadcn/ui
4. Set up Prisma with Supabase
5. Create base layout and routing

### Phase 2: CSV Module

1. Build drag-and-drop CSV uploader
2. Implement CSV parsing with Papa Parse
3. Create column type auto-detection
4. Build raw data table with pagination

### Phase 3: Filtering System

1. Create dynamic filter generation based on column types
2. Implement date range picker
3. Build text/number/category filters
4. Connect filters to data state

### Phase 4: Dashboard & KPIs

1. Create KPI calculation functions
2. Build KPI cards component
3. Implement real-time KPI updates

### Phase 5: Visualizations

1. Integrate Recharts library
2. Build Line, Bar, Pie charts
3. Add column selector for charts
4. Connect charts to filtered data

### Phase 6: Language Support

1. Set up i18n context
2. Create translation files (EN/MM)
3. Build language toggle component

### Phase 7: Export Features

1. Implement filtered CSV export
2. Add PDF/Image export (optional)

---

## Key Commands

```bash
# Development
npm run dev

# Build
npm run build

# Prisma
npx prisma generate
npx prisma db push
npx prisma studio

# Add shadcn components
npx shadcn@latest add button
npx shadcn@latest add table
npx shadcn@latest add card
```

---

## Database Schema (Prisma)

```prisma
// For session-based data storage (optional persistence)

model UploadSession {
  id        String   @id @default(cuid())
  fileName  String
  columns   Json     // Column metadata
  data      Json     // CSV data
  createdAt DateTime @default(now())
  expiresAt DateTime // Auto-cleanup
}

model SavedDashboard {
  id        String   @id @default(cuid())
  name      String
  filters   Json     // Saved filter state
  chartConfig Json   // Chart configurations
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

---

## Key Dependencies

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "typescript": "^5.0.0",
    "@prisma/client": "^5.0.0",
    "@supabase/supabase-js": "^2.0.0",
    "papaparse": "^5.4.0",
    "recharts": "^2.10.0",
    "date-fns": "^3.0.0",
    "@tanstack/react-table": "^8.0.0",
    "lucide-react": "^0.300.0"
  }
}
```

---

## Data Flow

```
CSV Upload → Parse → Detect Types → Store in Context
     ↓
Generate Filters (based on types)
     ↓
Apply Filters → Filter Data
     ↓
Update: Table, KPIs, Charts (all in sync)
```

---

## Critical Requirements

1. **Data Consistency**: Table, KPIs, and Charts MUST always show the same filtered data
2. **Dynamic Filters**: Filters must be auto-generated based on CSV column types
3. **Column Priority**: Selected filter column should appear first in table
4. **No Persistence (v1)**: All data is session-based, no permanent storage
5. **Bilingual**: Support Myanmar and English UI

---

## Development Notes

### CSV Parsing Strategy

- Use PapaParse for robust CSV parsing
- Detect column types by sampling first 100 rows
- Handle edge cases: empty cells, mixed types, special characters

### State Management

- Use React Context for global state
- Keep filtered data derived from base data + active filters
- Avoid caching that could cause mismatch

### Performance Optimization

- Virtual scrolling for large tables (100k rows)
- Debounce filter inputs
- Memoize expensive calculations

---

## File Naming Conventions

- Components: PascalCase (`CsvUploader.tsx`)
- Utilities: kebab-case (`csv-parser.ts`)
- Hooks: camelCase with 'use' prefix (`useCsvData.ts`)
- Types: PascalCase in kebab-case files (`types/csv.ts`)

---

## Testing Strategy

### Unit Tests

- CSV parsing functions
- Column type detection
- KPI calculations
- Filter logic

### Integration Tests

- CSV upload flow
- Filter application
- Export functionality

### Manual Testing

- UI responsiveness
- Language switching
- Large file handling

---

## Error Messages (Bilingual)

| Code        | English              | Myanmar                   |
| ----------- | -------------------- | ------------------------- |
| CSV_INVALID | Invalid CSV file     | CSV ဖိုင် မမှန်ကန်ပါ      |
| CSV_EMPTY   | File is empty        | ဖိုင်တွင် ဒေတာ မရှိပါ     |
| NO_HEADER   | Missing header row   | Header row မရှိပါ         |
| PARSE_ERROR | Failed to parse file | ဖိုင် ဖတ်ရန် မအောင်မြင်ပါ |

---

## Contact

For questions about this project, refer to the PRD.md or contact the project author.
