'use client';

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  ReactNode,
  useMemo,
} from 'react';
import { Filter, FilterState, FilterAction } from '@/types/filter';
import { CsvData } from '@/types/csv';

interface FilterContextType {
  filterState: FilterState;
  filteredData: Record<string, string | number | Date | null>[];
  addFilter: (filter: Filter) => void;
  updateFilter: (id: string, updates: Partial<Filter>) => void;
  removeFilter: (id: string) => void;
  clearAllFilters: () => void;
  setPriorityColumn: (columnName: string | null) => void;
  toggleFilter: (id: string) => void;
  applyFilters: (data: CsvData | null) => Record<string, string | number | Date | null>[];
}

const initialFilterState: FilterState = {
  filters: [],
  activeFilterCount: 0,
  priorityColumn: null,
};

function filterReducer(state: FilterState, action: FilterAction): FilterState {
  switch (action.type) {
    case 'ADD_FILTER':
      return {
        ...state,
        filters: [...state.filters, action.filter],
        activeFilterCount:
          state.filters.filter(f => f.isActive).length + (action.filter.isActive ? 1 : 0),
      };

    case 'UPDATE_FILTER':
      return {
        ...state,
        filters: state.filters.map(f =>
          f.id === action.id ? ({ ...f, ...action.updates } as Filter) : f
        ),
        activeFilterCount: state.filters
          .map(f => (f.id === action.id ? { ...f, ...action.updates } : f))
          .filter(f => f.isActive).length,
      };

    case 'REMOVE_FILTER':
      const removedFilter = state.filters.find(f => f.id === action.id);
      return {
        ...state,
        filters: state.filters.filter(f => f.id !== action.id),
        activeFilterCount: state.activeFilterCount - (removedFilter?.isActive ? 1 : 0),
      };

    case 'CLEAR_ALL_FILTERS':
      return initialFilterState;

    case 'SET_PRIORITY_COLUMN':
      return {
        ...state,
        priorityColumn: action.columnName,
      };

    case 'TOGGLE_FILTER':
      return {
        ...state,
        filters: state.filters.map(f => (f.id === action.id ? { ...f, isActive: !f.isActive } : f)),
        activeFilterCount: state.filters
          .map(f => (f.id === action.id ? { ...f, isActive: !f.isActive } : f))
          .filter(f => f.isActive).length,
      };

    default:
      return state;
  }
}

// Apply a single filter to a row
function matchesFilter(
  row: Record<string, string | number | Date | null>,
  filter: Filter
): boolean {
  if (!filter.isActive) return true;

  const value = row[filter.columnName];

  switch (filter.columnType) {
    case 'text':
      const textValue = String(value ?? '').toLowerCase();
      const filterValue = filter.value.toLowerCase();
      switch (filter.operator) {
        case 'equals':
          return textValue === filterValue;
        case 'contains':
          return textValue.includes(filterValue);
        case 'startsWith':
          return textValue.startsWith(filterValue);
        case 'endsWith':
          return textValue.endsWith(filterValue);
        default:
          return true;
      }

    case 'number':
      const numValue = Number(value);
      if (isNaN(numValue)) return false;
      switch (filter.operator) {
        case 'equals':
          return numValue === filter.value;
        case 'greaterThan':
          return numValue > filter.value;
        case 'lessThan':
          return numValue < filter.value;
        case 'between':
          return numValue >= filter.value && numValue <= (filter.valueTo ?? filter.value);
        default:
          return true;
      }

    case 'category':
      return filter.values.includes(String(value));

    case 'date':
      if (!value) return false;
      const dateValue = new Date(value as string | number | Date);
      if (isNaN(dateValue.getTime())) return false;
      const fromMatch = !filter.from || dateValue >= filter.from;
      const toMatch = !filter.to || dateValue <= filter.to;
      return fromMatch && toMatch;

    default:
      return true;
  }
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filterState, dispatch] = useReducer(filterReducer, initialFilterState);
  const [csvData, setCsvData] = React.useState<CsvData | null>(null);

  const addFilter = useCallback((filter: Filter) => {
    dispatch({ type: 'ADD_FILTER', filter });
  }, []);

  const updateFilter = useCallback((id: string, updates: Partial<Filter>) => {
    dispatch({ type: 'UPDATE_FILTER', id, updates });
  }, []);

  const removeFilter = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_FILTER', id });
  }, []);

  const clearAllFilters = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL_FILTERS' });
  }, []);

  const setPriorityColumn = useCallback((columnName: string | null) => {
    dispatch({ type: 'SET_PRIORITY_COLUMN', columnName });
  }, []);

  const toggleFilter = useCallback((id: string) => {
    dispatch({ type: 'TOGGLE_FILTER', id });
  }, []);

  const applyFilters = useCallback(
    (data: CsvData | null) => {
      setCsvData(data);
      if (!data) return [];

      const activeFilters = filterState.filters.filter(f => f.isActive);
      if (activeFilters.length === 0) return data.rows;

      return data.rows.filter(row => activeFilters.every(filter => matchesFilter(row, filter)));
    },
    [filterState.filters]
  );

  const filteredData = useMemo(() => {
    return applyFilters(csvData);
  }, [applyFilters, csvData]);

  return (
    <FilterContext.Provider
      value={{
        filterState,
        filteredData,
        addFilter,
        updateFilter,
        removeFilter,
        clearAllFilters,
        setPriorityColumn,
        toggleFilter,
        applyFilters,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
}

export function useFilterContext() {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilterContext must be used within a FilterProvider');
  }
  return context;
}
