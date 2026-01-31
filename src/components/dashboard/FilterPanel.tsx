'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { X, Plus, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { ColumnInfo } from '@/types/csv';
import {
  Filter as FilterType,
  TextFilter,
  NumberFilter,
  CategoryFilter,
  DateFilter,
} from '@/types/filter';
import { useLanguage } from '@/context/LanguageContext';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface FilterPanelProps {
  columns: ColumnInfo[];
  filters: FilterType[];
  onAddFilter: (filter: FilterType) => void;
  onUpdateFilter: (id: string, updates: Partial<FilterType>) => void;
  onRemoveFilter: (id: string) => void;
  onClearAll: () => void;
  onSetPriorityColumn: (columnName: string | null) => void;
  priorityColumn: string | null;
}

export function FilterPanel({
  columns,
  filters,
  onAddFilter,
  onUpdateFilter,
  onRemoveFilter,
  onClearAll,
  onSetPriorityColumn,
  priorityColumn,
}: FilterPanelProps) {
  const { t } = useLanguage();
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null);

  const activeFilters = useMemo(() => filters.filter(f => f.isActive), [filters]);

  // Filter out columns that already have filters applied
  const availableColumns = useMemo(() => {
    const filteredColumnNames = filters.map(f => f.columnName);
    return columns.filter(col => !filteredColumnNames.includes(col.name));
  }, [columns, filters]);

  const handleAddFilter = useCallback(() => {
    if (!selectedColumn) return;

    const column = columns.find(c => c.name === selectedColumn);
    if (!column) return;

    const id = `filter-${Date.now()}`;

    let newFilter: FilterType;
    switch (column.type) {
      case 'text':
        newFilter = {
          id,
          columnName: column.name,
          columnType: 'text',
          operator: 'contains',
          value: '',
          isActive: true,
        } as TextFilter;
        break;
      case 'number':
        newFilter = {
          id,
          columnName: column.name,
          columnType: 'number',
          operator: 'between',
          value: column.min ?? 0,
          valueTo: column.max ?? 1000,
          isActive: true,
        } as NumberFilter;
        break;
      case 'category':
        newFilter = {
          id,
          columnName: column.name,
          columnType: 'category',
          operator: 'in',
          values: column.uniqueValues ?? [],
          isActive: true,
        } as CategoryFilter;
        break;
      case 'date':
        newFilter = {
          id,
          columnName: column.name,
          columnType: 'date',
          operator: 'dateRange',
          from: null,
          to: null,
          isActive: true,
        } as DateFilter;
        break;
      default:
        return;
    }

    onAddFilter(newFilter);
    onSetPriorityColumn(column.name);
    setSelectedColumn(null);
  }, [selectedColumn, columns, onAddFilter, onSetPriorityColumn]);

  // Get column type icon
  const getColumnTypeIcon = (type: string) => {
    switch (type) {
      case 'number':
        return '🔢';
      case 'category':
        return '📂';
      case 'date':
        return '📅';
      default:
        return '📝';
    }
  };

  return (
    <div className="space-y-3">
      {/* Compact Inline Filter Selector */}
      <div className="flex items-center gap-2 flex-wrap">
        <Select value={selectedColumn ?? ''} onValueChange={setSelectedColumn}>
          <SelectTrigger className="h-9 w-full sm:w-56 text-sm">
            <SelectValue placeholder={t('filter.selectColumn')} />
          </SelectTrigger>
          <SelectContent>
            {availableColumns.length === 0 ? (
              <div className="p-2 text-xs text-muted-foreground text-center">
                ✓ All columns filtered
              </div>
            ) : (
              availableColumns.map(col => (
                <SelectItem key={col.name} value={col.name}>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{getColumnTypeIcon(col.type)}</span>
                    <span>{col.name}</span>
                    <span className="text-xs text-muted-foreground ml-auto">({col.type})</span>
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>

        <Button
          onClick={handleAddFilter}
          disabled={!selectedColumn || availableColumns.length === 0}
          size="sm"
          className="h-9 gap-1.5 bg-linear-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white disabled:opacity-50"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Filter
        </Button>

        {activeFilters.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="h-9 text-xs text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 ml-auto"
          >
            <X className="h-3 w-3 mr-1" />
            {t('filter.clearFilters') || 'Clear All'}
          </Button>
        )}
      </div>

      {/* Active Filters - Compact Cards */}
      {filters.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {filters.map(filter => (
            <FilterItem
              key={filter.id}
              filter={filter}
              column={columns.find(c => c.name === filter.columnName)!}
              onUpdate={updates => onUpdateFilter(filter.id, updates)}
              onRemove={() => onRemoveFilter(filter.id)}
              isPriority={priorityColumn === filter.columnName}
              onSetPriority={() => onSetPriorityColumn(filter.columnName)}
              t={t}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface FilterItemProps {
  filter: FilterType;
  column: ColumnInfo;
  onUpdate: (updates: Partial<FilterType>) => void;
  onRemove: () => void;
  isPriority: boolean;
  onSetPriority: () => void;
  t: (key: string) => string;
}

function FilterItem({
  filter,
  column,
  onUpdate,
  onRemove,
  isPriority,
  onSetPriority,
  t,
}: FilterItemProps) {
  // Get column type icon
  const getTypeIcon = () => {
    switch (column.type) {
      case 'number':
        return '🔢';
      case 'category':
        return '📂';
      case 'date':
        return '📅';
      default:
        return '📝';
    }
  };

  return (
    <div className={cn('p-2.5', !filter.isActive && 'opacity-60')}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={onSetPriority}
          className={cn(
            'flex items-center gap-1.5 text-xs font-medium transition-colors',
            isPriority
              ? 'text-violet-700 dark:text-violet-400'
              : 'text-slate-700 dark:text-slate-300 hover:text-violet-600'
          )}
        >
          <span>{getTypeIcon()}</span>
          <span className="truncate max-w-24">{filter.columnName}</span>
        </button>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
          onClick={onRemove}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>

      {/* Filter Controls - Compact */}
      {filter.columnType === 'text' && (
        <TextFilterInput filter={filter as TextFilter} onUpdate={onUpdate} t={t} />
      )}

      {filter.columnType === 'number' && (
        <NumberFilterInput
          filter={filter as NumberFilter}
          column={column}
          onUpdate={onUpdate}
          t={t}
        />
      )}

      {filter.columnType === 'category' && (
        <CategoryFilterInput
          filter={filter as CategoryFilter}
          column={column}
          onUpdate={onUpdate}
          t={t}
        />
      )}

      {filter.columnType === 'date' && (
        <DateFilterInput filter={filter as DateFilter} onUpdate={onUpdate} t={t} />
      )}
    </div>
  );
}

function TextFilterInput({
  filter,
  onUpdate,
  t,
}: {
  filter: TextFilter;
  onUpdate: (u: Partial<TextFilter>) => void;
  t: (k: string) => string;
}) {
  return (
    <div className="space-y-1.5">
      <Select
        value={filter.operator}
        onValueChange={v => onUpdate({ operator: v as TextFilter['operator'] })}
      >
        <SelectTrigger className="h-7 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="contains">{t('filter.contains')}</SelectItem>
          <SelectItem value="equals">{t('filter.equals')}</SelectItem>
        </SelectContent>
      </Select>
      <Input
        value={filter.value}
        onChange={e => onUpdate({ value: e.target.value })}
        placeholder="Enter value..."
        className="h-7 text-xs"
      />
    </div>
  );
}

function NumberFilterInput({
  filter,
  column,
  onUpdate,
  t,
}: {
  filter: NumberFilter;
  column: ColumnInfo;
  onUpdate: (u: Partial<NumberFilter>) => void;
  t: (k: string) => string;
}) {
  return (
    <div className="space-y-1.5">
      <Select
        value={filter.operator}
        onValueChange={v => onUpdate({ operator: v as NumberFilter['operator'] })}
      >
        <SelectTrigger className="h-7 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="between">{t('filter.between')}</SelectItem>
          <SelectItem value="greaterThan">{t('filter.greaterThan')}</SelectItem>
          <SelectItem value="lessThan">{t('filter.lessThan')}</SelectItem>
          <SelectItem value="equals">{t('filter.equals')}</SelectItem>
        </SelectContent>
      </Select>
      {filter.operator === 'between' ? (
        <div className="flex gap-1">
          <Input
            type="number"
            value={filter.value}
            onChange={e => onUpdate({ value: Number(e.target.value) })}
            placeholder={t('filter.min')}
            className="h-7 text-xs"
          />
          <Input
            type="number"
            value={filter.valueTo ?? column.max ?? 0}
            onChange={e => onUpdate({ valueTo: Number(e.target.value) })}
            placeholder={t('filter.max')}
            className="h-7 text-xs"
          />
        </div>
      ) : (
        <Input
          type="number"
          value={filter.value}
          onChange={e => onUpdate({ value: Number(e.target.value) })}
          className="h-7 text-xs"
        />
      )}
    </div>
  );
}

function CategoryFilterInput({
  filter,
  column,
  onUpdate,
  t,
}: {
  filter: CategoryFilter;
  column: ColumnInfo;
  onUpdate: (u: Partial<CategoryFilter>) => void;
  t: (k: string) => string;
}) {
  const allSelected = filter.values.length === (column.uniqueValues?.length ?? 0);

  const toggleValue = (value: string) => {
    const newValues = filter.values.includes(value)
      ? filter.values.filter(v => v !== value)
      : [...filter.values, value];
    onUpdate({ values: newValues });
  };

  const toggleAll = () => {
    onUpdate({
      values: allSelected ? [] : (column.uniqueValues ?? []),
    });
  };

  return (
    <div className="space-y-1.5">
      <Button variant="outline" size="sm" onClick={toggleAll} className="w-full h-6 text-xs">
        {allSelected ? t('common.clear') : t('filter.selectAll')}
      </Button>
      <div className="flex flex-wrap gap-1">
        {column.uniqueValues?.map(value => (
          <Badge
            key={value}
            variant={filter.values.includes(value) ? 'default' : 'outline'}
            className={cn(
              'cursor-pointer text-[10px] px-1.5 py-0',
              filter.values.includes(value) && 'bg-violet-600 hover:bg-violet-700'
            )}
            onClick={() => toggleValue(value)}
          >
            {value}
          </Badge>
        ))}
      </div>
    </div>
  );
}

function DateFilterInput({
  filter,
  onUpdate,
  t,
}: {
  filter: DateFilter;
  onUpdate: (u: Partial<DateFilter>) => void;
  t: (k: string) => string;
}) {
  return (
    <div className="flex gap-1">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="flex-1 h-7 justify-start text-[10px] px-2">
            <Calendar className="h-3 w-3 mr-1" />
            {filter.from ? format(filter.from, 'MMM d') : t('filter.from')}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <CalendarComponent
            mode="single"
            selected={filter.from ?? undefined}
            onSelect={date => onUpdate({ from: date ?? null })}
          />
        </PopoverContent>
      </Popover>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="flex-1 h-7 justify-start text-[10px] px-2">
            <Calendar className="h-3 w-3 mr-1" />
            {filter.to ? format(filter.to, 'MMM d') : t('filter.to')}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <CalendarComponent
            mode="single"
            selected={filter.to ?? undefined}
            onSelect={date => onUpdate({ to: date ?? null })}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
