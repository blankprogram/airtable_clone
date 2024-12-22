export interface FilterValue {
    operator:
      string
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

  export type ViewData = {
    id: number;
    name: string;
    sorting: SortingState;
    filters: ColumnFiltersState;
    columnVisibility: Record<string, boolean>;
  };

  export type UpdateData = {
    sorting?: string;
    filters?: string;
    columnVisibility?: string;
  };

  
  
  export type SortingState = SortingStateItem[];
  