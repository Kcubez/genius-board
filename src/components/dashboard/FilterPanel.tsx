'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Filter, X, Plus, Calendar, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            {t('filter.title')}
          </CardTitle>
          {activeFilters.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {activeFilters.length} {t('filter.activeFilters')}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">{t('filter.selectColumn')}</Label>
          <div className="flex gap-2">
            <Select value={selectedColumn ?? ''} onValueChange={setSelectedColumn}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder={t('filter.selectColumn')} />
              </SelectTrigger>
              <SelectContent>
                {columns.map(col => (
                  <SelectItem key={col.name} value={col.name}>
                    <span className="flex items-center gap-2">
                      {col.name}
                      <Badge variant="outline" className="text-xs">
                        {col.type}
                      </Badge>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={handleAddFilter}
              disabled={!selectedColumn}
              className="gap-2 bg-linear-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white transition-all duration-200 shadow-sm hover:shadow-md whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="h-4 w-4" />
              Add Filter
            </Button>
          </div>
        </div>

        <Separator />

        {/* Active Filters */}
        <div className="space-y-3">
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

        {filters.length > 0 && (
          <Button
            variant="outline"
            onClick={onClearAll}
            className="w-full text-destructive hover:text-destructive"
          >
            <X className="h-4 w-4 mr-2" />
            {t('filter.clearFilters')}
          </Button>
        )}

        {filters.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">{t('common.noData')}</p>
        )}
      </CardContent>
    </Card>
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
  return (
    <div
      className={cn(
        'p-3 rounded-lg border transition-all',
        isPriority && 'border-primary bg-primary/5',
        !filter.isActive && 'opacity-60'
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={onSetPriority}
          className={cn(
            'font-medium text-sm hover:text-primary transition-colors',
            isPriority && 'text-primary'
          )}
        >
          {filter.columnName}
        </button>
        <div className="flex items-center gap-1">
          <Badge variant={filter.isActive ? 'default' : 'secondary'} className="text-xs">
            {column.type}
          </Badge>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onRemove}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

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
    <div className="space-y-2">
      <Select
        value={filter.operator}
        onValueChange={v => onUpdate({ operator: v as TextFilter['operator'] })}
      >
        <SelectTrigger className="h-8">
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
        className="h-8"
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
    <div className="space-y-2">
      <Select
        value={filter.operator}
        onValueChange={v => onUpdate({ operator: v as NumberFilter['operator'] })}
      >
        <SelectTrigger className="h-8">
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
        <div className="flex gap-2">
          <Input
            type="number"
            value={filter.value}
            onChange={e => onUpdate({ value: Number(e.target.value) })}
            placeholder={t('filter.min')}
            className="h-8"
          />
          <Input
            type="number"
            value={filter.valueTo ?? column.max ?? 0}
            onChange={e => onUpdate({ valueTo: Number(e.target.value) })}
            placeholder={t('filter.max')}
            className="h-8"
          />
        </div>
      ) : (
        <Input
          type="number"
          value={filter.value}
          onChange={e => onUpdate({ value: Number(e.target.value) })}
          className="h-8"
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
      values: allSelected ? [] : column.uniqueValues ?? [],
    });
  };

  return (
    <div className="space-y-2">
      <Button variant="outline" size="sm" onClick={toggleAll} className="w-full h-7 text-xs">
        {allSelected ? t('common.clear') : t('filter.selectAll')}
      </Button>
      <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
        {column.uniqueValues?.map(value => (
          <Badge
            key={value}
            variant={filter.values.includes(value) ? 'default' : 'outline'}
            className="cursor-pointer text-xs"
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
    <div className="flex gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="flex-1 h-8 justify-start text-xs">
            <Calendar className="h-3 w-3 mr-1" />
            {filter.from ? format(filter.from, 'MMM d, yyyy') : t('filter.from')}
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
          <Button variant="outline" size="sm" className="flex-1 h-8 justify-start text-xs">
            <Calendar className="h-3 w-3 mr-1" />
            {filter.to ? format(filter.to, 'MMM d, yyyy') : t('filter.to')}
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
