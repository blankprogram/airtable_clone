"use client";
import { useParams } from "next/navigation";
import { useState } from "react";
import BaseHeader from "~/app/_components/BaseHeader";
import BaseTable from "~/app/_components/BaseTable";
import TableHeader from "~/app/_components/BaseTableHeader";
import Sidebar from "~/app/_components/BaseSidebar";
import { type RouterOutputs, api } from "~/trpc/react";

export default function Base() {
  const { baseId: baseIdString, tableId: tableIdString } = useParams<{ baseId: string; tableId: string }>();

  const baseId = parseInt(baseIdString, 10);
  const tableId = parseInt(tableIdString, 10);

  const { data: baseData, refetch, isLoading } = api.post.getBaseById.useQuery(
    { baseId },
    { enabled: !!baseId }
  );

  type RowData = RouterOutputs["post"]["getTableData"]["rows"];

  const [rows, setRows] = useState<RowData>(new Map());

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  const addBulkRowsMutation = api.post.addBulkRows.useMutation();

const addBulkRows = (count: number) => {
  const tempRows = new Map<number, { cells: Map<number, { cellId: number; value: string }> }>();
  const currentTime = Date.now();

  // Generate temporary rows
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

          data.rows.forEach((row: { id: number; cells: { columnId: number; cellId: number; value: string }[] }) => {
            const cellsMap = new Map<number, { cellId: number; value: string }>(
              row.cells.map((cell) => [cell.columnId, { cellId: cell.cellId, value: cell.value }])
            );
            updatedRows.set(row.id, { cells: cellsMap });
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
        <TableHeader isLoading={isLoading} toggleSidebar={toggleSidebar} addBulkRows={addBulkRows} />
      </div>

      <div className="flex flex-grow ">
        {isSidebarOpen && (
          <div className="flex-shrink-0 w-72 bg-white border-r border-gray-200 h-full">
            <Sidebar />
          </div>
        )}

        <div className="flex-grow flex flex-col overflow-hidden">

          <BaseTable
            tableId={tableId}
            rows={rows}
            setRows={setRows}
          />

        </div>
      </div>
    </div>
  );
};