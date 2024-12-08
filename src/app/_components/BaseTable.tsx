"use client";

import React, { useMemo, useState } from "react";
import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    useReactTable,
} from "@tanstack/react-table";
import { type RouterOutputs, api } from "~/trpc/react";

type RowData = Omit<RouterOutputs["post"]["getTableData"]["rows"][number], "id"> & {
    id: number | string;
};
type ColumnData = Omit<RouterOutputs["post"]["getTableData"]["columns"][number], "id"> & {
    id: number | null;
};

function TableHeader() {
    return (
        <div className="flex items-center justify-between p-2 bg-white border-b border-gray-300">
            <div className="flex items-center space-x-4">
                <button className="px-2 py-1 rounded  hover:bg-gray-200">
                    Views
                </button>
                <button className="px-2 py-1 rounded  hover:bg-gray-200">
                    Grid View
                </button>
                <button className="px-2 py-1 rounded  hover:bg-gray-200">
                    Hide Fields
                </button>
                <button className="px-2 py-1 rounded  hover:bg-gray-200">
                    Filter
                </button>
                <button className="px-2 py-1 rounded  hover:bg-gray-200">
                    Group
                </button>
                <button className="px-2 py-1 rounded  hover:bg-gray-200">
                    Sort
                </button>
                <button className="px-2 py-1 rounded  hover:bg-gray-200">
                    Color
                </button>
                <button className="px-2 py-1 rounded  hover:bg-gray-200">
                    Share
                </button>
                <button className="px-2 py-1 rounded  hover:bg-gray-200">
                    Sync
                </button>
            </div>



        </div>
    );
}


export default function BaseTable({ tableId }: { tableId: string }) {
    const { data, isLoading, error, refetch } = api.post.getTableData.useQuery({
        tableId: parseInt(tableId, 10),
    });

    const editCellMutation = api.post.editCell.useMutation({
        onSuccess: async () => {
            await refetch();
        },
        onError: async () => {
            await refetch();
        },
    });

    const [localRows, setLocalRows] = useState<RowData[]>([]);
    const [localColumns, setLocalColumns] = useState<ColumnData[]>([]);
    const [editingCell, setEditingCell] = useState<{
        rowId: number | string;
        columnId: number;
        value: string;
    } | null>(null);

    useMemo(() => {
        if (data) {
            setLocalRows(data.rows || []);
            setLocalColumns(data.columns || []);
        }
    }, [data]);

    const addRowMutation = api.post.addRow.useMutation({
        onSuccess: async (newRow) => {
            setLocalRows((prev) =>
                prev.map((row) => (row.id === newRow.id ? newRow : row))
            );
            await refetch();
        },
        onError: () => {
            setLocalRows((prev) => prev.slice(0, -1));
        },
    });

    const addColumnMutation = api.post.addColumn.useMutation({
        onSuccess: async () => {
            await refetch();
        },
        onError: () => {
            setLocalColumns((prev) => prev.slice(0, -1));
        },
    });

    const columnHelper = createColumnHelper<RowData>();

    const rowNumberColumn = columnHelper.display({
        id: "rowNumber",
        header: () => (
            <div style={{ display: "flex", justifyContent: "center" }}>
                <input type="checkbox" />
            </div>
        ),
        cell: (info) => (
            <div style={{ textAlign: "center" }}>{info.row.index + 1}</div>
        ),
        size: 50,
        minSize: 50,
        maxSize: 50,
        enableResizing: false,
    });

    const columns = useMemo(() => {
        if (!localColumns.length) return [];
        const dynamicColumns = localColumns.map((col) =>
            columnHelper.accessor(col.accessorKey as keyof RowData, {
                id: col.id?.toString() ?? "temp",
                header: col.name,
                cell: (info) => {
                    const cellValue = info.getValue() as string;
                    const rowId = info.row.original.id;
                    const columnId = parseInt(info.column.id, 10);

                    if (
                        editingCell &&
                        editingCell.rowId === rowId &&
                        editingCell.columnId === columnId
                    ) {
                        return (
                            <input
                                type="text"
                                value={editingCell.value}
                                onChange={(e) =>
                                    setEditingCell((prev) =>
                                        prev ? { ...prev, value: e.target.value } : null
                                    )
                                }
                                onBlur={() => {
                                    if (!editingCell) return;

                                    setLocalRows((prev) =>
                                        prev.map((row) =>
                                            row.id === editingCell.rowId
                                                ? { ...row, [info.column.id]: editingCell.value }
                                                : row
                                        )
                                    );

                                    editCellMutation.mutate({
                                        rowId: editingCell.rowId as number,
                                        columnId: editingCell.columnId,
                                        value: editingCell.value,
                                    });

                                    setEditingCell(null);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === "Escape") {
                                        if (!editingCell) return;

                                        setLocalRows((prev) =>
                                            prev.map((row) =>
                                                row.id === editingCell.rowId
                                                    ? { ...row, [info.column.id]: editingCell.value }
                                                    : row
                                            )
                                        );

                                        editCellMutation.mutate({
                                            rowId: editingCell.rowId as number,
                                            columnId: editingCell.columnId,
                                            value: editingCell.value,
                                        });

                                        setEditingCell(null);
                                    }
                                }}

                                autoFocus
                                className="border border-gray-300"
                                style={{ width: "100%", height: "100%" }}
                            />
                        );
                    }

                    return (
                        <div
                            onDoubleClick={() =>
                                setEditingCell({
                                    rowId: rowId as number,
                                    columnId,
                                    value: cellValue || "",
                                })
                            }
                            className="cursor-pointer"
                            style={{ minHeight: "1.5rem" }}
                        >
                            {cellValue}
                        </div>
                    );
                },
            })
        );
        return [rowNumberColumn, ...dynamicColumns];
    }, [localColumns, editingCell]);

    const table = useReactTable({
        data: localRows,
        columns,
        getCoreRowModel: getCoreRowModel(),
        columnResizeMode: "onChange",
        defaultColumn: {
            size: 150,
            minSize: 50,
            maxSize: 300,
        },
    });

    const handleAddRow = () => {
        const tempRow: RowData = {
            id: `temp-${Date.now()}`,
        };

        setLocalRows((prev) => [...prev, tempRow]);

        addRowMutation.mutate({
            tableId: parseInt(tableId, 10),
        });
    };

    const handleAddColumn = () => {
        const tempColumn: ColumnData = {
            id: null,
            name: `Column ${localColumns.length + 1}`,
            accessorKey: `column_${localColumns.length + 1}`,
            type: "TEXT",
        };
        setLocalColumns((prev) => [...prev, tempColumn]);

        addColumnMutation.mutate({
            tableId: parseInt(tableId, 10),
            name: tempColumn.name,
            type: tempColumn.type,
        });
    };

    if (isLoading) {
        return null;
    }
    return (
        <div style={{ overflowX: "auto" }}>
            <TableHeader />
            <table className="table-auto font-light border-collapse">

                <thead>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <tr key={headerGroup.id} className="border-b border-gray-300">
                            {headerGroup.headers.map((header, index: number) => (
                                <th
                                    key={header.id}
                                    className={`p-2 bg-[#f4f4f4] text-left font-light relative ${index === 0 ? "" : "border-r border-gray-300"
                                        }`}
                                    style={{
                                        width: `${header.getSize()}px`,
                                        border: index === 0 ? "none" : undefined, 
                                    }}
                                >
                                    {header.isPlaceholder
                                        ? null
                                        : flexRender(header.column.columnDef.header, header.getContext())}
                                    {header.column.getCanResize() && (
                                        <div
                                            onMouseDown={header.getResizeHandler()}
                                            onTouchStart={header.getResizeHandler()}
                                            className="absolute right-0 top-0 h-full w-1 bg-blue-500 cursor-col-resize opacity-0 hover:opacity-100"
                                        />
                                    )}
                                </th>
                            ))}

                            <th
                                className="bg-gray-100 border border-gray-300 px-8 cursor-pointer"
                                onClick={handleAddColumn}
                            >
                                +
                            </th>
                        </tr>
                    ))}
                </thead>
                <tbody>
                    {table.getRowModel().rows.map((row) => (
                        <tr key={row.id} className="hover:bg-[#f8f8f8]">
                            {row.getVisibleCells().map((cell, index: number) => (
                                <td
                                    key={cell.id}
                                    className={`p-1 text-sm bg-white border-b border-gray-300 ${index === 0 ? "" : "border-r  border-gray-300"
                                        }`}
                                >
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </td>
                            ))}
                        </tr>
                    ))}

                    <tr className="hover:bg-[#f8f8f8]">
                        <td
                            className="border-l border-b border-gray-300 p-1 text-center cursor-pointer bg-white"
                        >
                            <button onClick={handleAddRow}>+</button>
                        </td>
                        {Array.from({ length: table.getAllColumns().length - 2 }).map((_, index) => (
                            <td
                                key={index}
                                className={`border-b bg-white ${index === 0 ? "border-r border-gray-300" : "border-gray-300"
                                    }`}
                            ></td>
                        ))}
                        {table.getAllColumns().length > 1 && (
                            <td className="border-r border-b border-gray-300 bg-white"></td>
                        )}
                    </tr>

                </tbody>
            </table>
        </div>
    );
}
