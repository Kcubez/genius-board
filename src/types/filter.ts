import { ColumnType } from './csv';

// Filter Types
export type FilterOperator =
  | 'equals'
  | 'contains'
  | 'startsWith'
  | 'endsWith'
  | 'greaterThan'
  | 'lessThan'
  | 'between'
  | 'in'
  | 'dateRange';

// Base Filter
export interface BaseFilter {
  id: string;
  columnName: string;
  columnType: ColumnType;
  operator: FilterOperator;
  isActive: boolean;
}

// Text Filter
export interface TextFilter extends BaseFilter {
  columnType: 'text';
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith';
  value: string;
}

// Number Filter
export interface NumberFilter extends BaseFilter {
  columnType: 'number';
  operator: 'equals' | 'greaterThan' | 'lessThan' | 'between';
  value: number;
  valueTo?: number; // For 'between' operator
}

// Category Filter
export interface CategoryFilter extends BaseFilter {
  columnType: 'category';
  operator: 'in';
  values: string[];
}

// Date Filter
export interface DateFilter extends BaseFilter {
  columnType: 'date';
  operator: 'dateRange';
  from: Date | null;
  to: Date | null;
}

// Union type for all filters
export type Filter = TextFilter | NumberFilter | CategoryFilter | DateFilter;

// Filter State
export interface FilterState {
  filters: Filter[];
  activeFilterCount: number;
  priorityColumn: string | null; // Column to show first in table
}

// Filter Actions
export type FilterAction =
  | { type: 'ADD_FILTER'; filter: Filter }
  | { type: 'UPDATE_FILTER'; id: string; updates: Partial<Filter> }
  | { type: 'REMOVE_FILTER'; id: string }
  | { type: 'CLEAR_ALL_FILTERS' }
  | { type: 'SET_PRIORITY_COLUMN'; columnName: string | null }
  | { type: 'TOGGLE_FILTER'; id: string };
