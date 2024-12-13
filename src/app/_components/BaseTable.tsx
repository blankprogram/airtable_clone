"use client";

import React, { useMemo, useState } from "react";
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

function TableHeader({ isLoading, toggleSidebar }: { isLoading: boolean; toggleSidebar: () => void }) {
    const buttons = [
        { label: "Views", iconId: "List", style: "text-black" },
        { divider: true },
        { label: "Grid View", iconId: "GridFeature", style: "text-blue-700", isGridView: true },
        { label: "Hide Fields", iconId: "EyeSlash", style: "text-black" },
        { label: "Filter", iconId: "FunnelSimple", style: "text-black" },
        { label: "Group", iconId: "Group", style: "text-black" },
        { label: "Sort", iconId: "ArrowsDownUp", style: "text-black" },
        { label: "Color", iconId: "PaintBucket", style: "text-black" },
        { label: "", iconId: "RowHeightSmall", style: "text-black" },
        { label: "Share and Sync", iconId: "ArrowSquareOut", style: "text-black" },
    ];

    if (isLoading) {
        return (
            <div
                id="viewBar"
                role="region"
                aria-label="View configuration"
                className="flex items-center space-x-3 bg-white p-2 border-b border-gray-300 min-h-11"
            >

                <button
                    className="flex items-center px-2 py-1 rounded hover:bg-gray-100 focus:outline-none"
                    style={{ minHeight: "26px" }}

                >
                    <svg
                        width="16"
                        height="16"
                        className={`mr-1 text-black`}
                        fill="currentColor"
                        aria-hidden="true"
                        style={{ shapeRendering: "geometricPrecision" }}
                    >
                        <use href={`/icons/icon_definitions.svg#${"List"}`} />
                    </svg>
                    <span className="text-xs text-gray-700">{"Views"}</span>
                </button>


                <button
                    className="flex items-center px-2 py-1 rounded hover:bg-gray-100 focus:outline-none"
                    style={{ minHeight: "26px" }}
                >
                    <svg
                        width="16"
                        height="16"
                        className={`mr-1 text-blue-700`}
                        fill="currentColor"
                        aria-hidden="true"
                        style={{ shapeRendering: "geometricPrecision" }}
                    >
                        <use href={`/icons/icon_definitions.svg#${"GridFeature"}`} />
                    </svg>
                </button>


                <div className="px-14 py-2 rounded-md bg-gray-200">


                </div>
                <div className="px-8 py-2 rounded-md bg-gray-200">


                </div>


            </div>


        )
    }
    else return (


        <div
            id="viewBar"
            role="region"
            aria-label="View configuration"
            className="flex items-center space-x-3 bg-white p-2 border-b border-gray-300"
        >

            {buttons.map((button, index) => {
                if (button.divider) {
                    return (
                        <div
                            key={`divider-${index}`}
                            className="h-4 w-px bg-gray-300 mx-2"
                        ></div>
                    );
                }

                if (button.isGridView) {
                    return (
                        <button
                            key={button.iconId}
                            role="button"
                            className="flex items-center px-2 py-1 rounded hover:bg-gray-100 focus:outline-none"
                            style={{ minHeight: "26px" }}
                        >
                            <svg
                                width="16"
                                height="16"
                                className="flex-none"
                                fill="rgb(22, 110, 225)"
                                aria-hidden="true"
                                style={{ shapeRendering: "geometricPrecision" }}
                            >
                                <use href={`/icons/icon_definitions.svg#${button.iconId}`} />
                            </svg>

                            <span
                                className="strong truncate flex-auto text-gray-700 text-sm ml-1"
                                style={{ maxWidth: "200px" }}
                            >
                                {button.label}
                            </span>

                            <svg
                                width="16"
                                height="16"
                                className="flex-none mx-1"
                                fill="currentColor"
                                aria-hidden="true"
                                style={{ shapeRendering: "geometricPrecision" }}
                            >
                                <use href="/icons/icon_definitions.svg#UsersThree" />
                            </svg>

                            <svg
                                width="16"
                                height="16"
                                className="flex-none"
                                fill="currentColor"
                                aria-hidden="true"
                                style={{ shapeRendering: "geometricPrecision" }}
                            >
                                <use href="/icons/icon_definitions.svg#ChevronDown" />
                            </svg>
                        </button>

                    );
                }


                return (
                    <button
                        key={button.iconId}
                        role="button"
                        className="flex items-center px-2 py-1 rounded hover:bg-gray-100 focus:outline-none"
                        style={{ minHeight: "26px" }}
                        onClick={button.label == "Views" ? toggleSidebar : undefined}
                    >
                        <svg
                            width="16"
                            height="16"
                            className={`mr-1 ${button.style}`}
                            fill="currentColor"
                            aria-hidden="true"
                            style={{ shapeRendering: "geometricPrecision" }}
                        >
                            <use href={`/icons/icon_definitions.svg#${button.iconId}`} />
                        </svg>
                        <span className="text-xs text-gray-700">{button.label}</span>
                    </button>


                );

            })}

            <button className="text-sm font-light hover:bg-gray-100 px-2 py-1 rounded">
                <span>15000 rows</span>

            </button>

        </div>
    );
}

function Sidebar({ isOpen }: { isOpen: boolean }) {
    if (!isOpen) {
        return null;
    }

    return (
        <div className="bg-white border-r  w-72 flex flex-col">
            <div className="py-4 px-6">
                <div className="flex items-center justify-center mb-2">
                    <div className="flex items-center relative">
                        <svg
                            width="16"
                            height="16"
                            className="absolute left-2 text-gray-500"
                            fill="currentColor"
                            aria-hidden="true"
                            style={{ shapeRendering: "geometricPrecision" }}
                        >
                            <use href={`/icons/icon_definitions.svg#MagnifyingGlass`} />
                        </svg>

                        <input
                            type="text"
                            placeholder="Find a view"
                            className="bg-transparent pl-8 pr-8 focus:outline-none flex-grow text-sm"
                        />
                        <svg
                            width="16"
                            height="16"
                            className="absolute right-2 text-gray-500"
                            fill="currentColor"
                            aria-hidden="true"
                            style={{ shapeRendering: "geometricPrecision" }}
                        >
                            <use href={`/icons/icon_definitions.svg#Cog`} />
                        </svg>
                    </div>
                </div>
                <div className="border-b border-gray-300 mb-2"></div>

                <div>
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm">Grid View</p>
                        <button className="text-gray-500 text-sm">+</button>
                    </div>
                </div>
            </div>
            <div className="mt-auto px-6 pt-4">
                <div className="border-b border-gray-300 mb-4"></div>
                <div className="flex items-center justify-between ">
                    <p className="text-sm font-semibold">Create</p>
                    <button className="text-gray-500">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            className="w-4 h-4"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3.64645 5.64645C3.84171 5.45118 4.15829 5.45118 4.35355 5.64645L8 9.29289L11.6464 5.64645C11.8417 5.45118 12.1583 5.45118 12.3536 5.64645C12.5488 5.84171 12.5488 6.15829 12.3536 6.35355L8.35355 10.3536C8.15829 10.5488 7.84171 10.5488 7.64645 10.3536L3.64645 6.35355C3.45118 6.15829 3.45118 5.84171 3.64645 5.64645Z"
                            />
                        </svg>
                    </button>
                </div>
                <div className="space-y-3 py-6">
                    {[
                        { name: "Grid", icon: "GridFeature", color: "text-blue-500" },
                        { name: "Calendar", icon: "CalendarFeature", color: "text-[#dc703e]" },
                        { name: "Gallery", icon: "GalleryFeature", color: "text-purple-500" },
                        { name: "Kanban", icon: "KanbanFeature", color: "text-green-500" },
                        { name: "Timeline", icon: "TimelineFeature", color: "text-red-500" },
                        { name: "List", icon: "ListFeature", color: "text-blue-500" },
                        { name: "Gantt", icon: "Gantt", color: "text-[#63aaa6]" },
                        { name: "New Section", icon: "", color: "text-pink-500" },
                    ].map((view, index) => (
                        <div key={view.name}>
                            {view.icon ? (
                                <div className="flex items-center justify-between ">
                                    <div className="flex items-center gap-3">
                                        <svg
                                            width="16"
                                            height="16"
                                            fill="currentColor"
                                            aria-hidden="true"
                                            className={view.color}
                                        >
                                            <use href={`/icons/icon_definitions.svg#${view.icon}`} />
                                        </svg>
                                        <p className="text-sm font-medium">{view.name}</p>
                                    </div>
                                    <button className="text-gray-500 text-sm">
                                        <svg
                                            width="16"
                                            height="16"
                                            fill="currentColor"
                                            aria-hidden="true"
                                            className="text-gray-500"
                                        >
                                            <use href={`/icons/icon_definitions.svg#Plus`} />
                                        </svg>
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">

                                        <p className="text-sm font-medium">{view.name}</p>
                                    </div>
                                    <button className="text-gray-500 text-sm">
                                        <svg
                                            width="16"
                                            height="16"
                                            fill="currentColor"
                                            aria-hidden="true"
                                            className="text-gray-500"
                                        >
                                            <use href={`/icons/icon_definitions.svg#Plus`} />
                                        </svg>
                                    </button>
                                </div>
                            )}

                            {view.name === "New Section" && (
                                <>
                                    <div className="border-b border-gray-300 my-4"></div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <svg
                                                width="16"
                                                height="16"
                                                fill="currentColor"
                                                aria-hidden="true"
                                                className="text-pink-500"
                                            >
                                                <use href={`/icons/icon_definitions.svg#Form`} />
                                            </svg>
                                            <p className="text-sm font-medium">Form</p>
                                        </div>
                                        <button className="text-gray-500 text-sm">
                                            <svg
                                                width="16"
                                                height="16"
                                                fill="currentColor"
                                                aria-hidden="true"
                                                className="text-gray-500"
                                            >
                                                <use href={`/icons/icon_definitions.svg#Plus`} />
                                            </svg>
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>


            </div>

        </div>
    );
}

export default function BaseTable({ tableId }: { tableId: number }) {
    const { data, isLoading, refetch } = api.post.getTableData.useQuery({
        tableId: tableId,
    });


    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

    const editCellMutation = api.post.editCell.useMutation({
        onSuccess: async () => await refetch(),
        onError: async () => await refetch(),
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
    const handleAddRow = () => {
        const tempRow: RowData = {
            id: `temp-${Date.now()}`,
        };

        setLocalRows((prev) => [...prev, tempRow]);

        addRowMutation.mutate({
            tableId: tableId,
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
            tableId: tableId,
            name: tempColumn.name,
            type: tempColumn.type,
        });
    };
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
        onSuccess: async () => await refetch(),
        onError: () => {
            setLocalColumns((prev) => prev.slice(0, -1));
        },
    });

    const updateCellOptimistically = (
        info: CellContext<RowData, unknown>,
        editingCell: { rowId: number | string; columnId: number; value: string } | null
    ) => {
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
    };
    const columnHelper = createColumnHelper<RowData>();

    const rowNumberColumn = columnHelper.display({
        id: "rowNumber",
        header: () => (
            <div className="flex justify-start ml-1">
                <input type="checkbox" />
            </div>
        ),
        cell: (info) => (
            <div className="text-start ml-4">{info.row.index + 1}</div>
        ),
        size: 40,
        enableResizing: false,
    });






    const columns = useMemo(() => {
        if (!localColumns.length) return [];
        const dynamicColumns = localColumns.map((col, colIndex) =>
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
                                    updateCellOptimistically(info, editingCell);
                                    setEditingCell(null);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === "Escape") {
                                        updateCellOptimistically(info, editingCell);
                                        setEditingCell(null);
                                    } else if (e.key === "Tab") {
                                        e.preventDefault();
                                        updateCellOptimistically(info, editingCell);

                                        const nextColIndex = colIndex + 1;
                                        if (nextColIndex < localColumns.length) {
                                            const nextColumn = localColumns[nextColIndex];
                                            if (nextColumn) {
                                                setEditingCell({
                                                    rowId,
                                                    columnId: nextColumn.id!,
                                                    value: (info.row.original[nextColumn.accessorKey as keyof RowData] || "") as string,
                                                });
                                            }
                                        }
                                    }
                                }}
                                autoFocus
                                className="w-full h-full focus:outline-none px-2 py-1  border-2 border-blue-500"
                            />
                        );
                    }

                    return (
                        <div
                            onClick={() =>
                                setEditingCell({
                                    rowId: rowId as number,
                                    columnId,
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
        );
        return [rowNumberColumn, ...dynamicColumns];
    }, [localColumns, editingCell]);

    const table = useReactTable({
        data: localRows,
        columns,
        getCoreRowModel: getCoreRowModel(),
        columnResizeMode: "onChange",
        defaultColumn: {
            size: 200,
            minSize: 50,
            maxSize: 500,
            enableResizing: true,
        },
    });



    return (
        <div className="flex flex-col relative flex-grow ">

            <TableHeader isLoading={isLoading} toggleSidebar={toggleSidebar} />

            <div className="flex  flex-1">
                <Sidebar isOpen={isSidebarOpen} />

                <div className="flex-grow relative overflow-hidden">

                    {isLoading ? (
                        <div className="fixed inset-0 flex flex-col items-center justify-center ">
                            <div className="relative w-10 h-10">
                                <div className="absolute inset-0  border-4 border-t-transparent border-l-gray-500 border-r-gray-500 border-b-transparent rounded-full animate-spin"></div>
                            </div>
                            <p className="mt-4 text-gray-600 text-lg font-medium">Loading View</p>
                        </div>
                    ) : (
                        <div className="relative">

                            <div
                                className="absolute  bg-[#fcfcfc] border-gray-300 border-r min-h-screen"
                                style={{
                                    width: `${(table.getHeaderGroups()?.[0]?.headers?.[0]?.getSize?.() ?? 0) +
                                        (table.getHeaderGroups()?.[0]?.headers?.[1]?.getSize?.() ?? 0) + 1
                                        }px`,
                                    height: "100%",
                                }}
                            ></div>

                            <div
                                className="absolute  bg-[#fbfbfb] border-b border-gray-300 min-h-30 w-full"
                                style={{

                                    height: "30px",
                                }}
                            ></div>

                            <table className="table-auto border-collapse text-xs relative">
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
                                                    <div
                                                        className={`${index === 0
                                                            ? ""
                                                            : "flex items-center justify-between"
                                                            }`}
                                                    >

                                                        {header.isPlaceholder
                                                            ? null
                                                            : flexRender(header.column.columnDef.header, header.getContext())}

                                                        {index > 0 && (
                                                            <FiChevronDown className="text-gray-500 " />
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
                                            <th
                                                className="bg-gray-100 border-b border-l border-r border-gray-300 px-10 cursor-pointer text-gray-500 font-medium"
                                                onClick={handleAddColumn}
                                            >
                                                +
                                            </th>
                                        </tr>
                                    ))}
                                </thead>
                                <tbody>
                                    {table.getRowModel().rows.map((row) => (
                                        <tr key={row.id} className="hover:bg-gray-100 bg-white">
                                            {row.getVisibleCells().map((cell, index) => (
                                                <td
                                                    key={cell.id}
                                                    className={`p-0 text-xs border-b border-gray-300 ${index === 0 ? "text-gray-500" : "border-r border-gray-300"
                                                        }`}
                                                    style={{ height: "30px" }}
                                                >
                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}



                                    <tr className="hover:bg-gray-100 bg-white">
                                        <td
                                            className=" border-b border-gray-300  text-start text-lg flex cursor-pointer  text-gray-500 "
                                        >
                                            <button className={"ml-3"} onClick={handleAddRow}>+</button>
                                        </td>
                                        {Array.from({ length: table.getAllColumns().length - 2 }).map((_, index) => (

                                            <td
                                                key={index}
                                                className={`border-b  ${index === 0 ? "border-r border-gray-300 cursor-pointer" : "border-gray-300"
                                                    }`} onClick={handleAddRow}
                                            ></td>
                                        ))}
                                        {table.getAllColumns().length > 1 && (
                                            <td className="border-r border-b border-gray-300  cursor-pointer" onClick={handleAddRow}></td>
                                        )}
                                    </tr>

                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

            </div>
        </div>

    );
}
