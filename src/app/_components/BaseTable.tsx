"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    flexRender,
    getCoreRowModel,
    useReactTable,
    getFilteredRowModel,
    type Row,
    getSortedRowModel,
    type ColumnFiltersState,
} from "@tanstack/react-table";
import { type RouterOutputs, api } from "~/trpc/react";
import { FiChevronDown } from "react-icons/fi";
import { useVirtualizer } from "@tanstack/react-virtual";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { type FilterValue, type SortingState, type ViewData } from "./tableTypes";

type RowData = RouterOutputs["post"]["getTableData"]["rows"];
type ColumnData = RouterOutputs["post"]["getTableData"]["columns"];


type RowDataType = {
    id: number;
    pos: number;
    cells: Map<number, { cellId: number; value: string }>;
};

export const AddColumnDropdown = ({ onAddColumn }: { onAddColumn: (name: string, type: "TEXT" | "NUMBER") => void }) => {
    const [columnName, setColumnName] = useState("");

    const handleAddColumn = (type: "TEXT" | "NUMBER") => {
        const name = columnName.trim() || "New Column";
        onAddColumn(name, type);
        setColumnName("");
    };

    return (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
                <th
                    className="px-10 bg-gray-100 border-r border-gray-300 text-gray-500 font-medium text-center hover:bg-gray-200 cursor-pointer"
                >
                    <div className="w-full h-full flex items-center justify-center">
                        <span className="text-lg font-medium">+</span>
                    </div>
                </th>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
                <DropdownMenu.Content
                    className="bg-white border p-2 shadow-md rounded"
                    side="bottom"
                    align="start"
                    sideOffset={5}
                >
                    <input
                        type="text"
                        placeholder="Column Name"
                        value={columnName}
                        onChange={(e) => setColumnName(e.target.value)}
                        className="w-full px-2 py-1 mb-2 border border-gray-300 rounded"
                    />

                    <DropdownMenu.Item
                        onClick={() => handleAddColumn("TEXT")}
                        className="cursor-pointer px-4 py-2 hover:bg-gray-100 rounded"
                    >
                        Text
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                        onClick={() => handleAddColumn("NUMBER")}
                        className="cursor-pointer px-4 py-2 hover:bg-gray-100 rounded"
                    >
                        Number
                    </DropdownMenu.Item>
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    );
};

export default function BaseTable({
    tableId,
    rows,
    setRows,
    columns,
    setColumns,
    sorting,
    columnVisibility,
    filter,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isLoading,
}: {
    tableId: number;
    rows: RowData;
    setRows: React.Dispatch<React.SetStateAction<RowData>>;
    columns: ColumnData;
    setColumns: React.Dispatch<React.SetStateAction<ColumnData>>;
    sorting: SortingState;
    columnVisibility: Record<string, boolean>;
    filter: ColumnFiltersState;
    fetchNextPage: () => void;
    hasNextPage: boolean | undefined;
    isFetching: boolean;
    isLoading: boolean;
}) {

    const generateTempId = () => -Date.now() + Math.floor(Math.random() * 1000);

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

    const [globalFilter, setGlobalFilter] = useState("");
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);


    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key === "f") {
                e.preventDefault();
                setIsSearchOpen((prev) => !prev);
                setTimeout(() => {
                    if (!isSearchOpen) searchInputRef.current?.focus();
                }, 0);
            } else if (e.key === "Escape") {
                setIsSearchOpen(false);
                setGlobalFilter("");
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isSearchOpen]);

    const Filter = (row: Row<RowDataType>, columnId: string, value: string): boolean => {
        const cellValue = row.getValue(columnId);
        return cellValue?.toString().toLowerCase().includes(value.toLowerCase()) ?? false;
    };


    const fetchMore = useCallback(() => {
        const container = parentRef.current;

        if (container) {
            const { scrollHeight, scrollTop, clientHeight } = container;

            const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;

            if (scrollPercentage >= 0.8 && hasNextPage && !isFetching) {
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

    const isEmpty = (value: unknown): boolean => {
        return value === "" || value === null || value === undefined;
      };
      
      const isNumber = (value: unknown): value is number => {
        return typeof value === "number" || !isNaN(Number(value));
      };
      
      const toString = (value: unknown): string => {
        if (typeof value === "string") return value;
        if (typeof value === "number") return value.toString();
        return "";
      };
      
      const customFilterFn = (
        row: Row<RowDataType>,
        columnId: string,
        filterValue: FilterValue[]
      ): boolean => {
        const cellValue = row.getValue(columnId);
      
        return filterValue.every(({ operator, value }) => {
          if (value === undefined) return false;
      
          const cellValueStr = toString(cellValue);
          const filterValueStr = toString(value);
      
          switch (operator) {
            case "is_empty":
              return isEmpty(cellValue);
      
            case "is_not_empty":
              return !isEmpty(cellValue);
      
            case "equals":
              return cellValueStr === filterValueStr;
      
            case "contains":
              return cellValueStr.toLowerCase().includes(filterValueStr.toLowerCase());
      
            case "not_contains":
              return !cellValueStr.toLowerCase().includes(filterValueStr.toLowerCase());
      
            case "greater_than":
              return isNumber(cellValue) && isNumber(value) && Number(cellValue) > Number(value);
      
            case "less_than":
              return isNumber(cellValue) && isNumber(value) && Number(cellValue) < Number(value);
      
            default:
              return true;
          }
        });
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
                enableGlobalFilter: false,
                enableResizing: false,

            },
        ];

        const dynamicColumns = Array.from(columns.entries()).map(([columnId, column]) => ({
            header: column.name,
            accessorKey: columnId.toString(),
            filterFn: customFilterFn,
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
                const highlight = globalFilter && value?.toString().toLowerCase().includes(globalFilter.toLowerCase());
                const rowId = row.original.id;
                const isEditing =
                    editingCell &&
                    editingCell.rowId === rowId &&
                    editingCell.columnId === columnId;
                return isEditing ? (
                    <input
                        type={column.type}
                        className="w-full px-2 h-full focus:outline-none border-2 border-blue-500 "
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
                        className={`px-2 w-full h-full flex items-center cursor-pointer ${highlight ? "bg-[#ffd66b]" : ""}`}
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


    function transformFilters(filters: ColumnFiltersState): ColumnFiltersState {
        const groupedFilters: Record<string, unknown[]> = {};

        filters.forEach((filter) => {
            groupedFilters[filter.id] = groupedFilters[filter.id] ?? [];
            groupedFilters[filter.id]!.push(filter.value);
        });

        const transformedFilters: ColumnFiltersState = Object.entries(groupedFilters).map(([id, values]) => ({
            id,
            value: values,
        }));

        return transformedFilters;
    }




    const transformedFilters = useMemo(() => transformFilters(filter), [filter]);


    const table = useReactTable({
        data: tableData,
        columns: tableColumns,
        globalFilterFn: Filter,
        state: {
            columnFilters: transformedFilters,
            globalFilter,
            sorting,
            columnVisibility,
        },

        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        defaultColumn: {
            size: 200,
            minSize: 50,
            maxSize: 500,
        },
    });



    const parentRef = useRef<HTMLDivElement>(null);

    const rowVirtualizer = useVirtualizer({
        count: table.getRowModel().rows.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 34,
        overscan: 20,
    });

    const virtualRows = rowVirtualizer.getVirtualItems();
    const paddingTop = virtualRows[0]?.start ?? 0;
    const paddingBottom =
        virtualRows.length > 0
            ? rowVirtualizer.getTotalSize() - (virtualRows.at(-1)?.end ?? 0)
            : 0;

    const handleAddRow = () => addRowMutation.mutate({ tableId });
    const handleAddColumn = (name: string, type: "TEXT" | "NUMBER") => {
        addColumnMutation.mutate({
            tableId,
            name,
            type,
        });
    };

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
                if (!tempRow) return prev;

                const mergedCells = new Map<number, { cellId: number; value: string }>();
                tempRow.cells.forEach((localCell, columnId) => {
                    const serverCell = cells.get(columnId);
                    mergedCells.set(columnId, {
                        cellId: serverCell?.cellId ?? localCell.cellId,
                        value: localCell.value,
                    });
                });

                updatedRows.delete(tempRowId);
                updatedRows.set(id, { cells: mergedCells });
                return updatedRows;
            });

            setEditingCell((prev) =>
                prev?.rowId === tempRowId
                    ? { ...prev, rowId: id, cellId: cells.get(prev.columnId)?.cellId ?? prev.cellId }
                    : prev
            );

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
        onSuccess: ({ columns: newColumnMap, rows: updatedRows }, _, context) => {
            if (!context) return;

            const { tempColumnId } = context;

            const newColumnId = Array.from(newColumnMap.keys())[0];
            if (!newColumnId) return;

            setColumns((prev) => {
                const updatedColumns = new Map(prev);
                updatedColumns.delete(tempColumnId);
                updatedColumns.set(newColumnId, newColumnMap.get(newColumnId)!);
                return updatedColumns;
            });
            setRows((prev) => {
                const updatedRowsLocal = new Map(prev);
                updatedRowsLocal.forEach((row, rowId) => {
                    const tempCell = row.cells.get(tempColumnId);
                    const serverCell = updatedRows.get(rowId)?.cells.get(newColumnId);
                    if (tempCell && serverCell?.cellId) {
                        row.cells.set(newColumnId, { ...tempCell, cellId: serverCell.cellId });
                        row.cells.delete(tempColumnId);
                    }
                });
                return updatedRowsLocal;
            });

            setEditingCell((prev) => {
                if (!prev || prev.columnId !== tempColumnId) return prev;

                const serverCell = updatedRows.get(prev.rowId)?.cells.get(newColumnId);
                return serverCell?.cellId
                    ? { ...prev, columnId: newColumnId, cellId: serverCell.cellId }
                    : null;
            });


            setPendingEdits((prev) => {
                const updatedEdits = new Map(prev);

                for (const [rowId, rowEdits] of updatedEdits.entries()) {
                    if (!rowEdits.has(tempColumnId)) continue;

                    const newCellId = updatedRows.get(rowId)?.cells.get(newColumnId)?.cellId;

                    if (newCellId) {
                        const { value } = rowEdits.get(tempColumnId)!;
                        editCellMutation.mutate({ cellId: newCellId, value });
                        rowEdits.delete(tempColumnId);

                    }
                }

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
                <div className="fixed inset-0 flex flex-col items-center justify-center ">
                    <div className="relative w-10 h-10">
                        <div className="absolute inset-0 border-4 border-t-transparent border-l-gray-500 border-r-gray-500 border-b-transparent rounded-full animate-spin"></div>
                    </div>
                    <p className="mt-4 text-gray-600 text-lg font-medium">Loading View</p>
                </div>
            ) : (

                <div
                    ref={parentRef}
                    onScroll={() => fetchMore()}
                    className="relative h-[1135px] overflow-auto"
                >
                    {isSearchOpen && (
                        <div
                            tabIndex={0}
                            role="button"
                            className="absolute top-0 right-2 border border-t-0 rounded-b w-[300px] bg-white z-50"
                        >
                            <div className="flex items-center">
                                <input
                                    ref={searchInputRef}
                                    value={globalFilter}
                                    onChange={(e) => setGlobalFilter(e.target.value)}
                                    className="p-2 flex-grow focus:outline-none text-sm placeholder-gray-500"
                                    placeholder="Find in view"
                                    autoComplete="off"
                                />
                                <button
                                    tabIndex={0}
                                    role="button"
                                    className="px-2 cursor-pointer text-gray-500"
                                    onClick={() => {
                                        setGlobalFilter("");
                                        setIsSearchOpen(false);
                                    }}
                                >
                                    <svg
                                        width="16"
                                        height="16"
                                        fill="currentColor"
                                        aria-hidden="true"
                                        className="shape-geometric hover:text-black"
                                    >
                                        <use href={`/icons/icon_definitions.svg#X`} />
                                    </svg>
                                </button>
                            </div>
                            <div className="p-2 text-[10px] bg-[#f2f2f2]">
                                <div className="text-gray-600 flex items-center">
                                    <span>Use advanced search options in the</span>
                                    <svg
                                        width="16"
                                        height="16"
                                        fill="currentColor"
                                        aria-hidden="true"
                                        className="text-blue-600 shape-geometric mx-1"
                                    >
                                        <use href={`/icons/icon_definitions.svg#ExtensionsFeature`} />
                                    </svg>
                                    <button className="text-blue-600 font-bold underline">search extension</button>
                                </div>
                                <div className="text-gray-600 text-center">.</div>
                            </div>
                        </div>
                    )}

                    <div
                        className="absolute top-0 left-0 bg-grey-100 border-r border-gray-300 h-full"
                        style={{
                            width: `${(table.getHeaderGroups()?.[0]?.headers?.[0]?.getSize?.() ?? 0) +
                                (table.getHeaderGroups()?.[0]?.headers?.[1]?.getSize?.() ?? 0) +
                                1
                                }px`,
                        }}
                    ></div>

                    <div className="absolute top-0 bg-[#fbfbfb] border-b border-gray-300 w-full h-[30px]"></div>

                    <table className="text-xs relative">
                        <thead className="h-[30px]">
                            {table.getHeaderGroups().map((headerGroup) => (
                                <tr key={headerGroup.id} className="border-b border-gray-300">
                                    {headerGroup.headers.map((header, index) => (
                                        <th
                                            key={header.id}
                                            className={`relative px-2 bg-gray-100 font-normal text-black ${index === 0
                                                ? ""
                                                : "border-r border-gray-300"
                                                }`}
                                            style={{ width: `${header.getSize()}px` }}
                                        >
                                            <div
                                                className={
                                                    index === 0 ? "" : "flex items-center justify-between"
                                                }
                                            >


                                                {flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}

                                                {index > 0 && (
                                                    <FiChevronDown className="text-gray-500" />
                                                )}
                                            </div>
                                            {header.column.getCanResize() && (
                                                <div
                                                    onMouseDown={header.getResizeHandler()}
                                                    onTouchStart={header.getResizeHandler()}
                                                    className="absolute right-0 top-0 h-full w-0.5 bg-blue-500 cursor-col-resize opacity-0 hover:opacity-100"
                                                />
                                            )}
                                        </th>
                                    ))}

                                    <AddColumnDropdown onAddColumn={handleAddColumn} />

                                </tr>
                            ))}
                        </thead>
                        <tbody>
                            <tr style={{ height: `${paddingTop}px` }} aria-hidden="true" />

                            {virtualRows.map((virtualRow) => {
                                const row = table.getRowModel().rows[virtualRow.index];
                                if (!row) return null;

                                return (
                                    <tr key={row.id} className="hover:bg-gray-100 bg-white">
                                        {row.getVisibleCells().map((cell, index) => (
                                            <td
                                                key={cell.id}
                                                className={`border-b p-0 border-gray-300 ${index === 0 ? "" : "border-r"
                                                    }`}
                                                style={{ height: "30px" }}
                                            >
                                                {flexRender(
                                                    cell.column.columnDef.cell,
                                                    cell.getContext()
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                );
                            })}

                            <tr style={{ height: `${paddingBottom}px` }} aria-hidden="true" />

                            <tr
                                className="hover:bg-gray-100 bg-white cursor-pointer"
                                onClick={handleAddRow}
                            >
                                <td className="text-center text-lg border-b border-gray-300">+</td>
                                {Array.from({ length: table.getVisibleLeafColumns().length - 1 }).map((_, colIndex) => (
                                    <td
                                        key={colIndex}
                                        className={`border-b border-gray-300 ${colIndex === 0 || colIndex === table.getVisibleLeafColumns().length - 2
                                            ? "border-r"
                                            : ""
                                            }`}
                                    ></td>
                                ))}
                            </tr>
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}    