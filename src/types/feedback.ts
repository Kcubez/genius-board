export interface Feedback {
  id: string;
  userId: string | null;
  userEmail: string | null;
  type: 'feature_inquiry' | 'feature_request' | 'bug_report' | 'general';
  message: string;
  response: string | null;
  status: 'pending' | 'reviewed' | 'resolved';
  createdAt: string;
  updatedAt: string;
}

export interface FeedbackCreateInput {
  type: Feedback['type'];
  message: string;
}

// Known features for auto-reply
export const KNOWN_FEATURES = [
  {
    keywords: ['upload', 'csv', 'excel', 'data', 'import'],
    feature: 'CSV/Excel Upload',
    description:
      'You can upload CSV files by going to Dashboard and clicking "Upload CSV" button. Supported formats are .csv files up to 4MB.',
  },
  {
    keywords: ['chart', 'graph', 'visualize', 'visualization'],
    feature: 'Data Visualization',
    description:
      'After uploading data, charts are automatically generated based on your data columns. You can see bar charts, pie charts, and line graphs.',
  },
  {
    keywords: ['filter', 'search', 'find'],
    feature: 'Data Filtering',
    description:
      'Use the Filter panel to filter your data by any column. You can filter by text, numbers, dates, and categories.',
  },
  {
    keywords: ['export', 'download'],
    feature: 'Export Data',
    description: 'Click the "Export" button to download your filtered data as a CSV file.',
  },
  {
    keywords: ['clean', 'cleaner', 'fix', 'error', 'duplicate'],
    feature: 'Data Cleaner',
    description:
      'Use the "Clean Data" button to automatically fix common data issues like duplicates, missing values, and formatting errors.',
  },
  {
    keywords: ['report', 'reports', 'dashboard'],
    feature: 'Reports Dashboard',
    description:
      'Access all your uploaded datasets from the Dashboard. Each dataset shows KPIs, charts, and a data table.',
  },
  {
    keywords: ['kpi', 'summary', 'total', 'average'],
    feature: 'KPI Cards',
    description:
      'KPI cards automatically calculate totals, averages, and other metrics from your data.',
  },
  {
    keywords: ['edit', 'modify', 'update', 'change'],
    feature: 'Edit Data',
    description:
      'You can edit data directly in the table. Click on any cell to modify it, then save your changes.',
  },
];
