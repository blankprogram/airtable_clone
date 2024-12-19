"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import BaseHeader from "~/app/_components/BaseHeader";
import BaseTable from "~/app/_components/BaseTable";
import TableHeader from "~/app/_components/BaseTableHeader";
import Sidebar from "~/app/_components/BaseSidebar";
import { type RouterOutputs, api } from "~/trpc/react";
import { type ColumnFiltersState, type SortingState, type ViewData } from "~/app/_components/tableTypes";

export default function Base() {
  const { baseId: baseIdString, tableId: tableIdString } = useParams<{ baseId: string; tableId: string }>();

  const baseId = parseInt(baseIdString, 10);
  const tableId = parseInt(tableIdString, 10);

  const { data: baseData, refetch, isLoading } = api.post.getBaseById.useQuery(
    { baseId },
    { enabled: !!baseId }
  );

  type RowData = RouterOutputs["post"]["getTableData"]["rows"];
  type ColumnData = RouterOutputs["post"]["getTableData"]["columns"];


  const [columnVisibility, setVisibility] = useState<Record<string, boolean>>({});
  const [sorting, setSorting] = useState<SortingState>([]);
  const [filter, setFilter] = useState<ColumnFiltersState>([]);

  const [rows, setRows] = useState<RowData>(new Map());
  const [columns, setColumns] = useState<ColumnData>(new Map());


  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  const [views, setViews] = useState<ViewData[]>([]);
  const [currentViewId, setCurrentViewId] = useState<number | null>(null);

  const fetchSize = 200;
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isLoading: tableLoading,
  } = api.post.getTableData.useInfiniteQuery(
    {
      tableId,
      limit: fetchSize,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  );

  console.log(views.find((view) => view.id === currentViewId))

  useEffect(() => {
    if (!data) return;


    const firstPageColumns = data.pages[0]?.columns ?? new Map();
    setColumns(firstPageColumns);

    const combinedRows: RowData = new Map();
    data.pages.forEach((page) => {
      Array.from(page.rows.entries()).forEach(([rowId, rowData]) => {
        combinedRows.set(rowId, rowData);
      });
    });
    setRows(combinedRows);


    const allViews = data.pages[0]?.views ?? [];
    setViews(allViews);
    if (currentViewId === null && allViews.length > 0) {
      setCurrentViewId(allViews[0]?.id ?? null);
    }
  }, [data]);

  useEffect(() => {
    if (!currentViewId) return;

    const selectedView = views.find((view) => view.id === currentViewId);

    if (selectedView) {
      setFilter(selectedView.filters);
      setSorting(selectedView.sorting);
      setVisibility(selectedView.columnVisibility);
    }
  }, [currentViewId]);

  const updateViewMutation = api.post.updateView.useMutation();

  useEffect(() => {
    if (!currentViewId) return;

    const selectedViewIndex = views.findIndex((view) => view.id === currentViewId);

    if (selectedViewIndex >= 0) {
      const updatedViews = [...views];
      const selectedView = updatedViews[selectedViewIndex]!;

      updatedViews[selectedViewIndex] = {
        ...selectedView,
        filters: filter,
        sorting: sorting,
        columnVisibility: columnVisibility,
        id: selectedView.id,
        name: selectedView.name || "View",
      };

      setViews(updatedViews);
    }


    const debounceTimer = setTimeout(() => {
      updateViewMutation.mutate({
        viewId: currentViewId,
        sorting,
        filters: filter,
        columnVisibility,
      });
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [currentViewId, sorting, filter, columnVisibility]);



  const addBulkRowsMutation = api.post.addBulkRows.useMutation();

  const addBulkRows = (count: number) => {
    const tempRows = new Map<number, { cells: Map<number, { cellId: number; value: string }> }>();
    const currentTime = Date.now();

    for (let i = 0; i < count; i++) {
      const tempId = -(currentTime + i);
      tempRows.set(tempId, { cells: new Map<number, { cellId: number; value: string }>() });
    }

    setRows((prevRows) => new Map<number, { cells: Map<number, { cellId: number; value: string }> }>([
      ...prevRows,
      ...tempRows,
    ]));

    addBulkRowsMutation.mutate(
      { tableId, rowCount: count },
      {
        onSuccess: (data) => {
          setRows((prevRows) => {
            const updatedRows = new Map(prevRows);

            tempRows.forEach((_, tempId) => updatedRows.delete(tempId));
            const rowsMap = data.rows as Map<
              number,
              { cells: Map<number, { cellId: number; value: string }> }
            >;
            rowsMap.forEach((rowData, rowId) => {
              updatedRows.set(rowId, { cells: rowData.cells });
            });

            return updatedRows;
          });
        },
        onError: () => {
          setRows((prevRows) => {
            const rolledBackRows = new Map(prevRows);


            tempRows.forEach((_, tempId) => rolledBackRows.delete(tempId));

            return rolledBackRows;
          });
        },
      }
    );



  };

  return (
    <div className="flex flex-col h-screen bg-[#f7f7f7]">
      <div className="flex-shrink-0">
        <BaseHeader
          baseId={baseId}
          tableId={tableId}
          baseData={baseData}
          isLoading={isLoading}
          refetch={refetch}

        />
      </div>

      <div className="flex-shrink-0 bg-white border-b border-gray-200 z-10">
        <TableHeader
          isLoading={isLoading}
          toggleSidebar={toggleSidebar}
          addBulkRows={addBulkRows}
          sorting={sorting}
          columns={columns}
          setSorting={setSorting}
          columnVisibility={columnVisibility}
          setVisibility={setVisibility}
          filter={filter}
          setFilter={setFilter}
        />
      </div>

      <div className="flex flex-grow ">
        {isSidebarOpen && (
          <div className="flex-shrink-0 w-72 bg-white border-r border-gray-200 h-full">
            <Sidebar
              views={views}
              setViews={setViews}
              currentViewId={currentViewId}
              setCurrentViewId={setCurrentViewId}
              tableId={tableId}
            />

          </div>
        )}

        <div className="flex-grow flex flex-col overflow-hidden">

          <BaseTable
            tableId={tableId}
            rows={rows}
            setRows={setRows}
            columns={columns}
            setColumns={setColumns}
            sorting={sorting}
            columnVisibility={columnVisibility}
            filter={filter}
            fetchNextPage={fetchNextPage}
            hasNextPage={hasNextPage}
            isFetching={isFetching}
            isLoading={tableLoading}
          />


        </div>
      </div>
    </div>
  );
};