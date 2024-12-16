"use client";
import { useParams } from "next/navigation";
import { useState } from "react";
import BaseHeader from "~/app/_components/BaseHeader";
import BaseTable from "~/app/_components/BaseTable";
import TableHeader from "~/app/_components/BaseTableHeader";
import Sidebar from "~/app/_components/BaseSidebar";
import { type RouterOutputs, api } from "~/trpc/react";

export default function Base() {
  const { baseId, tableId } = useParams<{ baseId: string; tableId: string }>();
  const { data: baseData, refetch, isLoading } = api.post.getBaseById.useQuery(
    { baseId: parseInt(baseId, 10) },
    { enabled: !!baseId }
  );

  type RowData = RouterOutputs["post"]["getTableData"]["rows"];

  const [rows, setRows] = useState<RowData>(new Map());

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  // const addBulkRowsMutation = api.post.addBulkRows.useMutation();

  return (
    <div className="flex flex-col h-screen bg-[#f7f7f7]">
      <div className="flex-shrink-0">
        <BaseHeader
          baseId={parseInt(baseId, 10)}
          tableId={tableId}
          baseData={baseData}
          isLoading={isLoading}
          refetch={refetch}
        />
      </div>

      <div className="flex-shrink-0 bg-white border-b border-gray-200 z-10">
        <TableHeader isLoading={isLoading} toggleSidebar={toggleSidebar} />
      </div>

      <div className="flex flex-grow overflow-hidden">
        {isSidebarOpen && (
          <div className="flex-shrink-0 w-72 bg-white border-r border-gray-200 h-full">
            <Sidebar />
          </div>
        )}

        <div className="flex-grow flex flex-col overflow-hidden">
          <div className="flex-grow overflow-auto">
            <BaseTable
              tableId={parseInt(tableId, 10)}
              rows={rows}
              setRows={setRows}
            />
          </div>
        </div>
      </div>
    </div>
  );
};