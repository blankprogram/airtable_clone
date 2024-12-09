"use client";

import React, { useMemo, useState, useEffect, useCallback } from "react";
import {
    type CellContext,
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    useReactTable,
} from "@tanstack/react-table";
import { type RouterOutputs, api } from "~/trpc/react";
import { FiChevronDown } from "react-icons/fi";

type RowData = Omit<RouterOutputs["post"]["getTableData"]["rows"][number], "id"> & {
    id: number | string;
};
type ColumnData = Omit<RouterOutputs["post"]["getTableData"]["columns"][number], "id"> & {
    id: number | null;
};

function TableHeader() {
    const buttons = [
        "Views",
        "Grid View",
        "Hide Fields",
        "Filter",
        "Group",
        "Sort",
        "Color",
        "Share",
        "Sync",
    ];

    return (
        <div className="flex items-center justify-between p-2 bg-white border-b border-gray-300">
            <div className="flex items-center space-x-4">
                {buttons.map((label) => (
                    <button key={label} className="px-2 py-1 rounded hover:bg-gray-200">
                        {label}
                    </button>
                ))}
            </div>
        </div>
    );
}

export default function BaseTable({ tableId }: { tableId: string }) {
    const { data, isLoading, refetch } = api.post.getTableData.useQuery({
        tableId: parseInt(tableId, 10),
    });

    const editCellMutation = api.post.editCell.useMutation({
        onSuccess: () => refetch(),
        onError: () => refetch(),
    });

    const [localRows, setLocalRows] = useState<RowData[]>([]);
    const [localColumns, setLocalColumns] = useState<ColumnData[]>([]);
    const [editingCell, setEditingCell] = useState<{
        rowId: number | string;
        columnId: number;
        value: string;
    } | null>(null);

    useEffect(() => {
        if (data) {
            setLocalRows(data.rows || []);
            setLocalColumns(data.columns || []);
        }
    }, [data]);

    const handleAddRow = useCallback(() => {
        const tempRow: RowData = { id: `temp-${Date.now()}` };

        setLocalRows((prev) => [...prev, tempRow]);
        addRowMutation.mutate({ tableId: parseInt(tableId, 10) });
    }, [tableId]);

    const handleAddColumn = useCallback(() => {
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
    }, [localColumns, tableId]);

    const addRowMutation = api.post.addRow.useMutation({
        onSuccess: async (newRow)  => {
            setLocalRows((prev) =>
                prev.map((row) => (row.id === newRow.id ? newRow : row))
            );
            await refetch();
        },
        onError: () => setLocalRows((prev) => prev.slice(0, -1)),
    });

    const addColumnMutation = api.post.addColumn.useMutation({
        onSuccess: () => refetch(),
        onError: () => setLocalColumns((prev) => prev.slice(0, -1)),
    });

    const updateCellOptimistically = useCallback(
        (info: CellContext<RowData, unknown>) => {
            if (!editingCell) return;
    
            setLocalRows((prevRows) =>
                prevRows.map((row) =>
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
        },
        [editingCell, editCellMutation]
    );
    

    const columnHelper = createColumnHelper<RowData>();

    const rowNumberColumn = columnHelper.display({
        id: "rowNumber",
        header: () => (
            <div className="flex justify-center">
                <input type="checkbox" />
            </div>
        ),
        cell: (info) => <div className="text-center">{info.row.index + 1}</div>,
        size: 50,
        minSize: 50,
        maxSize: 50,
        enableResizing: false,
    });

    const columns = useMemo(() => {
        if (!localColumns.length) return [];

        return [
            rowNumberColumn,
            ...localColumns.map((col, colIndex) =>
                columnHelper.accessor(col.accessorKey as keyof RowData, {
                    id: col.id?.toString() ?? "temp",
                    header: col.name,
                    cell: (info) => {
                        const cellValue = info.getValue() as string;
                        const rowId = info.row.original.id;

                        if (
                            editingCell &&
                            editingCell.rowId === rowId &&
                            editingCell.columnId === parseInt(info.column.id, 10)
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
                                    onBlur={() => updateCellOptimistically(info)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Escape" || e.key === "Tab") {
                                            e.preventDefault();
                                            updateCellOptimistically(info);
                                        }
                                    }}
                                    autoFocus
                                    className="w-full h-full focus:outline-none px-2 py-1 rounded-md border-2 border-blue-500"
                                />
                            );
                        }

                        return (
                            <div
                                onClick={() =>
                                    setEditingCell({
                                        rowId,
                                        columnId: parseInt(info.column.id, 10),
                                        value: cellValue || "",
                                    })
                                }
                                className="cursor-pointer w-full h-full px-2 py-1 flex items-center"
                            >
                                {cellValue}
                            </div>
                        );
                    },
                })
            ),
        ];
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
            enableResizing: true,
        },
    });

    if (isLoading) return null;

    return (
        <div className="overflow-x-auto">
            <TableHeader />
            <table className="table-auto border-collapse text-sm">
                <thead>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <tr key={headerGroup.id} className="border-b border-gray-300">
                            {headerGroup.headers.map((header, index) => (
                                <th
                                    key={header.id}
                                    className={`relative px-2 bg-gray-100 font-light text-black ${
                                        index === 0
                                            ? "text-center"
                                            : "text-left border-r border-gray-300"
                                    }`}
                                    style={{ width: `${header.getSize()}px` }}
                                >
                                    <div
                                        className={`${
                                            index === 0
                                                ? "flex justify-center items-center"
                                                : "flex items-center justify-between"
                                        }`}
                                    >
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                  header.column.columnDef.header,
                                                  header.getContext()
                                              )}
                                        {index > 0 && (
                                            <FiChevronDown className="text-gray-500 ml-2" />
                                        )}
                                    </div>
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
                                className="bg-gray-100 border border-gray-300 px-10 cursor-pointer text-gray-500 text-xl font-medium"
                                onClick={handleAddColumn}
                            >
                                +
                            </th>
                        </tr>
                    ))}
                </thead>
                <tbody>
                    {table.getRowModel().rows.map((row) => (
                        <tr key={row.id} className="hover:bg-gray-100">
                            {row.getVisibleCells().map((cell, index) => (
                                <td
                                    key={cell.id}
                                    className={`p-0 text-sm bg-white border-b border-gray-300 ${
                                        index === 0 ? "text-gray-500" : "border-r border-gray-300"
                                    }`}
                                    style={{ height: "40px" }}
                                >
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </td>
                            ))}
                        </tr>
                    ))}
                    <tr className="hover:bg-gray-100">
                        <td className="border-l border-b border-gray-300 text-center cursor-pointer bg-white text-gray-500 text-2xl">
                            <button onClick={handleAddRow}>+</button>
                        </td>
                        {Array.from({ length: table.getAllColumns().length - 2 }).map((_, index) => (
                            <td
                                key={index}
                                className={`border-b bg-white ${
                                    index === 0 ? "border-r border-gray-300" : "border-gray-300"
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
