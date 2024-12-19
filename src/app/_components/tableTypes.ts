export interface FilterValue {
    operator:
      | "contains"
      | "not_contains"
      | "equals"
      | "greater_than"
      | "less_than"
      | "is_empty"
      | "is_not_empty";
    value?: string | number;
  }
  
  export interface ColumnFilter {
    id: string;
    value: FilterValue;
  }
  
  export type ColumnFiltersState = ColumnFilter[];
  
  export interface Column {
    name: string;
    type: "TEXT" | "NUMBER";
  }
  
  export type ColumnsMap = Map<number, Column>;
  
  export interface SortingStateItem {
    id: string;
    desc: boolean;
  }
  
  export type SortingState = SortingStateItem[];
  