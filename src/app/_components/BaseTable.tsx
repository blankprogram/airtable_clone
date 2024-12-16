"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    flexRender,
    getCoreRowModel,
    useReactTable,
} from "@tanstack/react-table";
import { type RouterOutputs, api } from "~/trpc/react";
import { FiChevronDown } from "react-icons/fi";
import { useVirtualizer } from "@tanstack/react-virtual";

type RowData = RouterOutputs["post"]["getTableData"]["rows"];
type ColumnData = RouterOutputs["post"]["getTableData"]["columns"];


export default function BaseTable({
    tableId,
    rows,
    setRows,
}: {
    tableId: number;
    rows: RowData;
    setRows: React.Dispatch<React.SetStateAction<RowData>>;
}) {
    const generateTempId = () => -Date.now() + Math.floor(Math.random() * 1000);


    const [dropdownVisible, setDropdownVisible] = useState(false);
    const dropdownRef = useRef<HTMLDivElement | null>(null);
    const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number }>({
        top: 0,
        left: 0,
    });


    const toggleDropdown = (event: React.MouseEvent<HTMLElement>) => {
        const rect = event.currentTarget.getBoundingClientRect();
        setDropdownPosition({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX });
        setDropdownVisible((prev) => !prev);
    };

    const fetchSize = 100;
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetching,
        isLoading,
    } = api.post.getTableData.useInfiniteQuery(
        {
            tableId,
            limit: fetchSize,
        },
        {
            getNextPageParam: (lastPage) => lastPage.nextCursor,
        }
    );

    const [columns, setColumns] = useState<ColumnData>(new Map());

    const [editingCell, setEditingCell] = useState<{
        cellId: number;
        value: string;
        rowId: number;
        columnId: number;
    } | null>(null);

    const [pendingEdits, setPendingEdits] = useState<
        Map<
            number,
            Map<number, { cellId: number; value: string }>
        >
    >(new Map());



    useEffect(() => {
        if (data) {
            const firstPageColumns = data.pages[0]?.columns ?? new Map();
            setColumns(firstPageColumns);

            const combinedRows: RowData = new Map();

            data.pages.forEach((page) => {
                Array.from(page.rows.entries()).forEach(([rowId, rowData]) => {
                    combinedRows.set(rowId, rowData);
                });
            });

            setRows(combinedRows);
        }
    }, [data, setRows, setColumns]);


    const fetchMoreOnBottomReached = useCallback(() => {
        const container = parentRef.current;
        if (container) {
            const { scrollHeight, scrollTop, clientHeight } = container;

            if (
                scrollHeight - scrollTop - clientHeight < 300 &&
                hasNextPage &&
                !isFetching
            ) {
                void fetchNextPage();
            }
        }
    }, [fetchNextPage, hasNextPage, isFetching]);



    const updateData = (rowId: number, columnId: number, value: string) => {
        const cellId = rows.get(rowId)?.cells.get(columnId)?.cellId;

        setRows((prev) => {
            const updatedRows = new Map(prev);
            const row = updatedRows.get(rowId);
            if (row) {
                const cell = row.cells.get(columnId);
                if (cell) {
                    cell.value = value;
                }
            }
            return updatedRows;
        });

        if (cellId && cellId < 0) {
            setPendingEdits((prev) => {
                const updatedEdits = new Map(prev);
                const rowEdits =
                    updatedEdits.get(rowId) ??
                    new Map<number, { cellId: number; value: string }>();
                rowEdits.set(columnId, { cellId, value });
                updatedEdits.set(rowId, rowEdits);
                return updatedEdits;
            });
        } else if (cellId) {
            editCellMutation.mutate({ cellId, value });
        }
    };

    const tableData = useMemo(() => {
        return Array.from(rows.entries()).map(([rowId, row], index) => ({
            id: rowId,
            pos: index + 1,
            cells: row.cells,
            ...Object.fromEntries(
                Array.from(row.cells.entries()).map(([columnId, cell]) => [
                    columnId.toString(),
                    cell.value,
                ])
            ),
        }));
    }, [rows]);

    const tableColumns = useMemo(() => {
        const baseColumns = [
            {
                header: "",
                accessorKey: "pos",
                cell: ({ getValue }: { getValue: () => number }) => (
                    <div className="text-center px-2">{getValue()}</div>
                ),
                size: 50,
            },
        ];

        const dynamicColumns = Array.from(columns.entries()).map(([columnId, column]) => ({
            header: column.name,
            accessorKey: columnId.toString(),
            cell: ({
                row,
            }: {
                row: {
                    original: {
                        id: number;
                        cells: Map<number, { cellId: number; value: string }>;
                    };
                };
            }) => {
                const value = row.original.cells.get(columnId)?.value;
                const rowId = row.original.id;
                const isEditing =
                    editingCell &&
                    editingCell.rowId === rowId &&
                    editingCell.columnId === columnId;
                return isEditing ? (
                    <input
                        type={column.type}
                        className="w-full px-2 h-full focus:outline-none border-2 border-blue-500"
                        value={editingCell.value || ""}
                        onChange={(e) =>
                            setEditingCell((prev) =>
                                prev ? { ...prev, value: e.target.value } : null
                            )
                        }
                        onBlur={() => {
                            if (editingCell) {
                                updateData(editingCell.rowId, editingCell.columnId, editingCell.value);
                                setEditingCell(null);
                            }
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Tab") {
                                e.preventDefault();
                                if (editingCell) {
                                    updateData(editingCell.rowId, editingCell.columnId, editingCell.value);

                                    const columnIds = Array.from(columns.keys());
                                    const currentIndex = columnIds.indexOf(editingCell.columnId);
                                    const nextColumnId = columnIds[currentIndex + 1];

                                    if (nextColumnId !== undefined) {
                                        const nextCell = row.original.cells.get(nextColumnId);
                                        setEditingCell({
                                            cellId: nextCell?.cellId ?? 0,
                                            rowId,
                                            columnId: nextColumnId,
                                            value: nextCell?.value ?? "",
                                        });
                                    } else {
                                        setEditingCell(null);
                                    }
                                }
                            } else if (e.key === "Escape") {
                                if (editingCell) {
                                    updateData(editingCell.rowId, editingCell.columnId, editingCell.value);
                                    setEditingCell(null);
                                }
                            }
                        }}
                        autoFocus
                    />
                ) : (
                    <div
                        className="px-2 w-full h-full flex items-center cursor-pointer"
                        onClick={() =>
                            setEditingCell({
                                cellId: row.original.cells.get(columnId)?.cellId ?? 0,
                                rowId,
                                columnId,
                                value: value ?? "",
                            })
                        }
                    >
                        {value}
                    </div>
                );
            },
        }));

        return [...baseColumns, ...dynamicColumns];
    }, [columns, editingCell, updateData, rows]);

    const table = useReactTable({
        data: tableData,
        columns: tableColumns,
        getCoreRowModel: getCoreRowModel(),
        defaultColumn: {
            size: 200,
            minSize: 50,
            maxSize: 500,
            enableResizing: true,
        },
    });

    const parentRef = useRef<HTMLDivElement>(null);

    const rowVirtualizer = useVirtualizer({
        count: rows.size,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 34,
        overscan: 10,
    });

    const virtualRows = rowVirtualizer.getVirtualItems();
    const paddingTop = virtualRows[0]?.start ?? 0;
    const paddingBottom =
        virtualRows.length > 0
            ? rowVirtualizer.getTotalSize() - (virtualRows.at(-1)?.end ?? 0)
            : 0;

    const handleAddRow = () => addRowMutation.mutate({ tableId });
    const handleAddColumn = (type: "TEXT" | "NUMBER") => {
        setDropdownVisible(false)
        addColumnMutation.mutate({ tableId, name: `Column ${columns.size + 1}`, type });
    }

    const editCellMutation = api.post.editCell.useMutation();

    const addRowMutation = api.post.addRow.useMutation({
        onMutate: async () => {
            const tempRowId = generateTempId();
            setRows((prev) => {
                const newRow = {
                    cells: new Map(
                        Array.from(columns.keys()).map((columnId) => [
                            columnId,
                            { cellId: generateTempId(), value: "" },
                        ])
                    ),
                };
                const updatedRows = new Map(prev);
                updatedRows.set(tempRowId, newRow);
                return updatedRows;
            });
            return { tempRowId };
        },
        onSuccess: ({ id, cells }, _, context) => {
            if (!context) return;
            const { tempRowId } = context;

            setRows((prev) => {
                const updatedRows = new Map(prev);
                const tempRow = updatedRows.get(tempRowId);
                if (!tempRow) return updatedRows;

                updatedRows.delete(tempRowId);

                const mergedCells = new Map(
                    Array.from(tempRow.cells.entries()).map(([columnId, localCell]) => {
                        const serverCell = cells.get(columnId);
                        return [
                            columnId,
                            {
                                ...localCell,
                                cellId: serverCell?.cellId ?? localCell.cellId,
                            },
                        ];
                    })
                );

                updatedRows.set(id, { cells: mergedCells });
                return updatedRows;
            });

            setEditingCell((prev) => {
                if (prev && prev.rowId === tempRowId) {
                    const updatedCell = cells.get(prev.columnId);
                    return updatedCell
                        ? { ...prev, rowId: id, cellId: updatedCell.cellId }
                        : null;
                }
                return prev;
            });

            setPendingEdits((prev) => {
                const updatedEdits = new Map(prev);
                const rowEdits = updatedEdits.get(tempRowId);
                if (rowEdits) {
                    rowEdits.forEach(({ value }, columnId) => {
                        const newCellId = cells.get(columnId)?.cellId;
                        if (newCellId) {
                            editCellMutation.mutate({ cellId: newCellId, value });
                        }
                    });
                    updatedEdits.delete(tempRowId);
                }
                return updatedEdits;
            });
        },
        onError: (_, __, context) => {
            if (!context) return;
            const { tempRowId } = context;
            setRows((prev) => {
                const updatedRows = new Map(prev);
                updatedRows.delete(tempRowId);
                return updatedRows;
            });
        },
    });


    const addColumnMutation = api.post.addColumn.useMutation({
        onMutate: async ({ name, type = "TEXT" }) => {
            const tempColumnId = generateTempId();
            setColumns((prev) => {
                const updatedColumns = new Map(prev);
                updatedColumns.set(tempColumnId, { name, type });
                return updatedColumns;
            });

            setRows((prev) => {
                const updatedRows = new Map(prev);
                updatedRows.forEach((row) => {
                    row.cells.set(tempColumnId, { cellId: generateTempId(), value: "" });
                });
                return updatedRows;
            });

            return { tempColumnId };
        },
        onSuccess: ({ id, rows: updatedCells }, _, context) => {
            if (!context) return;
            const { tempColumnId } = context;

            setColumns((prev) => {
                const updatedColumns = new Map(prev);
                const tempColumn = updatedColumns.get(tempColumnId);
                if (tempColumn) {
                    updatedColumns.delete(tempColumnId);
                    updatedColumns.set(id, tempColumn);
                }
                return updatedColumns;
            });

            setRows((prev) => {
                const updatedRows = new Map(prev);
                updatedRows.forEach((row, rowId) => {
                    const serverCell = updatedCells.get(rowId);
                    if (serverCell) {
                        const localCell = row.cells.get(tempColumnId);
                        if (localCell) {
                            row.cells.set(id, {
                                ...localCell,
                                cellId: serverCell.cellId,
                            });
                            row.cells.delete(tempColumnId);
                        }
                    }
                });
                return updatedRows;
            });

            setEditingCell((prev) => {
                if (prev && prev.columnId === tempColumnId) {
                    const updatedCell = updatedCells.get(prev.rowId);
                    return updatedCell
                        ? { ...prev, columnId: id, cellId: updatedCell.cellId }
                        : null;
                }
                return prev;
            });

            setPendingEdits((prev) => {
                const updatedEdits = new Map(prev);
                updatedEdits.forEach((rowEdits, rowId) => {
                    const cellEdit = rowEdits.get(tempColumnId);
                    if (cellEdit) {
                        const newCellId = updatedCells.get(rowId)?.cellId;
                        if (newCellId) {
                            editCellMutation.mutate({ cellId: newCellId, value: cellEdit.value });
                        }
                        rowEdits.delete(tempColumnId);
                    }
                });
                return updatedEdits;
            });
        },
        onError: (_, __, context) => {
            if (!context) return;
            const { tempColumnId } = context;

            setColumns((prev) => {
                const updatedColumns = new Map(prev);
                updatedColumns.delete(tempColumnId);
                return updatedColumns;
            });

            setRows((prev) => {
                const updatedRows = new Map(prev);
                updatedRows.forEach((row) => {
                    row.cells.delete(tempColumnId);
                });
                return updatedRows;
            });
        },
    });

    return (
        <div>
            {isLoading ? (
                <div className="fixed inset-0 flex flex-col items-center justify-center">
                    <div className="relative w-10 h-10">
                        <div className="absolute inset-0 border-4 border-t-transparent border-l-gray-500 border-r-gray-500 border-b-transparent rounded-full animate-spin"></div>
                    </div>
                    <p className="mt-4 text-gray-600 text-lg font-medium">Loading View</p>
                </div>
            ) : (
                <div ref={parentRef} onScroll={() => fetchMoreOnBottomReached()} className="relative h-[1135px] overflow-auto">
                    <div
                        className="absolute bg-[#fcfcfc] border-r border-gray-300 min-h-screen"
                        style={{
                            width: `${(table.getHeaderGroups()?.[0]?.headers?.[0]?.getSize?.() ?? 0) +
                                (table.getHeaderGroups()?.[0]?.headers?.[1]?.getSize?.() ?? 0) + 1
                                }px`,
                        }}
                    ></div>

                    <div className="absolute bg-[#fbfbfb] border-b border-gray-300 w-full h-[30px]"></div>

                    <table className="table-auto text-xs relative">
                        <thead style={{ height: "30px" }}>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <tr key={headerGroup.id} className="border-b border-gray-300">
                                    {headerGroup.headers.map((header, index) => (
                                        <th
                                            key={header.id}
                                            className={`relative px-2 bg-gray-100 font-normal text-black ${index === 0 ? "text-center" : "text-left border-r border-gray-300"
                                                }`}
                                            style={{ width: `${header.getSize()}px` }}
                                        >
                                            <div className={index === 0 ? "" : "flex items-center justify-between"}>
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(header.column.columnDef.header, header.getContext())}

                                                {index > 0 && <FiChevronDown className="text-gray-500" />}
                                            </div>
                                            {header.column.getCanResize() && (
                                                <div
                                                    onMouseDown={header.getResizeHandler()}
                                                    onTouchStart={header.getResizeHandler()}
                                                    className={`absolute right-0 top-0 h-full w-0.5 bg-blue-500 cursor-col-resize opacity-0 hover:opacity-100`}
                                                />
                                            )}
                                        </th>
                                    ))}
                                    <th
                                        className="bg-gray-100 border-b border-l border-r border-gray-300 px-10 cursor-pointer text-gray-500 font-medium text-center"
                                        onClick={toggleDropdown}
                                    >
                                        +
                                    </th>
                                </tr>
                            ))}
                        </thead>
                        <tbody>
                            <tr style={{ height: `${paddingTop}px` }} aria-hidden="true" />

                            {virtualRows.map((virtualRow) => {
                                const rowIndex = virtualRow.index;
                                const row = table.getRowModel().rows[rowIndex];

                                if (!row) return null;

                                return (
                                    <tr key={row.id} className="hover:bg-gray-100 bg-white">
                                        {row.getVisibleCells().map((cell, index) => (
                                            <td
                                                key={cell.id}
                                                className={`border-b border-gray-300 ${index === 0 ? "" : "border-r"}`}
                                                style={{ height: "30px" }}
                                            >
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </td>
                                        ))}
                                    </tr>
                                );
                            })}

                            <tr style={{ height: `${paddingBottom}px` }} aria-hidden="true" />

                            <tr className="hover:bg-gray-100 bg-white cursor-pointer" onClick={handleAddRow}>
                                <td className="text-center text-lg border-b border-gray-300">+</td>
                                {Array.from({ length: columns.size }).map((_, index) => (
                                    <td
                                        key={index}
                                        className={`border-b border-gray-300 ${index === 0 || index === columns.size - 1 ? "border-r" : ""}`}
                                    ></td>
                                ))}
                            </tr>
                        </tbody>
                    </table>
                </div>
            )}
            {dropdownVisible && (
                <div
                    ref={dropdownRef}
                    className="absolute bg-white border shadow-lg rounded p-2 z-10"
                    style={{
                        top: dropdownPosition.top,
                        left: dropdownPosition.left,
                    }}
                >
                    <button
                        onClick={() => handleAddColumn("TEXT")}
                        className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                    >
                        Text
                    </button>
                    <button
                        onClick={() => handleAddColumn("NUMBER")}
                        className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                    >
                        Number
                    </button>
                </div>
            )}


        </div>

    );
}    