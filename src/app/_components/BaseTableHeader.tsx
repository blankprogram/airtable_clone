import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { type SortingState } from "@tanstack/react-table";
import { useState } from "react";
import * as Switch from "@radix-ui/react-switch";
import { type RouterOutputs } from "~/trpc/react";
type ColumnData = RouterOutputs["post"]["getTableData"]["columns"];
function SortingDropdown({
    columns,
    sorting,
    setSorting,
}: {
    columns: Map<number, { name: string; type: "TEXT" | "NUMBER" }>;
    sorting: SortingState;
    setSorting: (updater: SortingState | ((prev: SortingState) => SortingState)) => void;

}) {
    const updateColumnSort = (index: number, columnId: string) => {
        setSorting((prevSorting) =>
            prevSorting.map((sort, i) =>
                i === index ? { ...sort, id: columnId } : sort
            )

        );
    };

    const updateSortDirection = (index: number, direction: boolean) => {
        setSorting((prevSorting) =>
            prevSorting.map((sort, i) =>
                i === index ? { ...sort, desc: direction } : sort
            )
        );
    };

    const removeSort = (index: number) => {
        setSorting((prevSorting) => prevSorting.filter((_, i) => i !== index));
    };

    const addSort = (columnId: string) => {
        setSorting((prevSorting) => [
            ...prevSorting,
            { id: columnId, desc: false },
        ]);
    };

    return (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
                <button className="flex items-center px-2 py-1 rounded hover:bg-gray-100 focus:outline-none">
                    <svg
                        width="16"
                        height="16"
                        className="mr-1 text-black"
                        fill="currentColor"
                        aria-hidden="true"
                        style={{ shapeRendering: "geometricPrecision" }}
                    >
                        <use href={`/icons/icon_definitions.svg#ArrowsDownUp`} />
                    </svg>
                    <span className="text-xs text-gray-700">Sort By</span>
                </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
                <DropdownMenu.Content
                    className="bg-white border rounded shadow p-4  mt-2 text-xs min-w-96 "
                    align="start"
                >
                    <div className="flex justify-between items-center">
                        <span className="font-medium ">Sort By</span>
                    </div>
                    <hr className="my-2 border-gray-300" />

                    {sorting.map(({ id, desc }, index) => {
                        const availableColumns = Array.from(columns.entries()).filter(
                            ([colId]) =>
                                !sorting.some(
                                    (sort, i) => sort.id === colId.toString() && i !== index
                                )
                        );

                        return (
                            <div
                                key={index}
                                className="flex items-center justify-between mb-4"
                            >
                                <select
                                    value={id}
                                    onChange={(e) =>
                                        updateColumnSort(index, e.target.value)
                                    }
                                    className="w-56 p-1 border rounded"
                                >
                                    {availableColumns.map(([colId, { name }]) => (
                                        <option
                                            key={colId}
                                            value={colId.toString()}
                                        >
                                            {name}
                                        </option>
                                    ))}
                                </select>
                                <select
                                    value={desc ? "desc" : "asc"}
                                    onChange={(e) =>
                                        updateSortDirection(
                                            index,
                                            e.target.value === "desc"
                                        )
                                    }
                                    className="w-24 ml-2 p-1 border rounded"
                                >
                                    {columns.get(Number(id))?.type === "TEXT" ? (
                                        <>
                                            <option value="asc">A→Z</option>
                                            <option value="desc">Z→A</option>
                                        </>
                                    ) : (
                                        <>
                                            <option value="asc">1→9</option>
                                            <option value="desc">9→1</option>
                                        </>
                                    )}
                                </select>
                                <button
                                    onClick={() => removeSort(index)}
                                    className="ml-2 text-gray-500"
                                    aria-label="Remove Sort"
                                >
                                    ✕
                                </button>
                            </div>
                        );
                    })}

                    <div className="mt-4">
                        <DropdownMenu.Root>
                            <DropdownMenu.Trigger asChild>
                                <button className="flex items-center text-gray-500 hover:underline">
                                    <span className="mr-2">+</span> Add Another Sort
                                </button>
                            </DropdownMenu.Trigger>
                            <DropdownMenu.Content
                                className="bg-white border rounded p-1 max-h-48 overflow-auto w-96"
                                align="start"
                                sideOffset={10}

                            >
                                {Array.from(columns.entries())
                                    .filter(
                                        ([id]) =>
                                            !sorting.some(
                                                (sort) => sort.id === id.toString()
                                            )
                                    )
                                    .map(([colId, { name }]) => (
                                        <DropdownMenu.Item
                                            key={colId}
                                            onClick={() => addSort(colId.toString())}
                                            className="cursor-pointer px-2 py-1 hover:bg-gray-100 rounded"
                                        >
                                            {name}
                                        </DropdownMenu.Item>
                                    ))}
                            </DropdownMenu.Content>
                        </DropdownMenu.Root>
                    </div>
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    );
}



function ColumnVisibilityDropdown({
    columns,
    visibility,
    setVisibility,
}: {
    columns: Map<number, { name: string; type: "TEXT" | "NUMBER" }>;
    visibility: Record<string, boolean>;
    setVisibility: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}) {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredColumns = Array.from(columns.entries()).filter(([_, column]) =>
        column.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleHideAll = () => {
        const allHidden = Object.fromEntries(
            Array.from(columns.keys()).map((id) => [id.toString(), false])
        );
        setVisibility(allHidden);
    };

    const handleShowAll = () => {
        const allVisible = Object.fromEntries(
            Array.from(columns.keys()).map((id) => [id.toString(), true])
        );
        setVisibility(allVisible);
    };

    return (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
                <button className="flex items-center px-2 py-1 rounded hover:bg-gray-100 focus:outline-none">
                    <svg
                        width="16"
                        height="16"
                        className="mr-1 text-black"
                        fill="currentColor"
                        aria-hidden="true"
                        style={{ shapeRendering: "geometricPrecision" }}
                    >
                        <use href="/icons/icon_definitions.svg#EyeSlash" />
                    </svg>
                    <span className="text-xs text-gray-700">Hide Fields</span>
                </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
                <DropdownMenu.Content className="bg-white border rounded p-4 mt-2 text-sm w-80" align="start">

                    <div className="flex flex-col space-y-3">
                        <input
                            type="text"
                            placeholder="Find a field"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className=" px-2 py-1 outline-none text-xs"
                        />
                        <hr className="border-gray-300" />
                        <div className="space-y-2">
                            {filteredColumns.map(([id, column]) => (
                                <div key={id} className="flex items-center">
                                    <Switch.Root
                                        className={`w-3 h-2 rounded-full relative ${
                                            visibility[id.toString()]
                                                ? "bg-green-500"
                                                : "bg-gray-300"
                                        }`}
                                        id={`switch-${id}`}
                                        checked={visibility[id.toString()] ?? true}
                                        onCheckedChange={(isSelected) =>
                                            setVisibility((prev) => ({
                                                ...prev,
                                                [id.toString()]: isSelected,
                                            }))
                                        }
                                    >
                                        <Switch.Thumb
                                            className={`block w-1 h-1 rounded-full bg-white transform transition ${
                                                visibility[id.toString()]
                                                    ? "translate-x-1.5"
                                                    : "translate-x-0.5"
                                            }`}
                                        />
                                    </Switch.Root>
                                    <span className="text-xs text-gray-700 ml-2">{column.name}</span>
                                </div>
                            ))}
                        </div>


                        <div className="flex justify-between ">
                            <button
                                onClick={handleHideAll}
                                className="text-xs text-gray-400 bg-gray-100 hover:bg-gray-200 px-11 py-1 rounded"
                            >
                                Hide All
                            </button>
                            <button
                                onClick={handleShowAll}
                                className="text-xs text-gray-400 bg-gray-100 hover:bg-gray-200 px-11 py-1 rounded"
                            >
                                Show All
                            </button>
                        </div>
                    </div>
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    );
}



function Button({
    label,
    iconId,
    onClick,
    extraClass,
}: {
    label?: string;
    iconId: string;
    onClick?: () => void;
    extraClass?: string;
}) {
    return (
        <button
            className={`flex items-center px-2 py-1 rounded hover:bg-gray-100 focus:outline-none ${extraClass}`}
            onClick={onClick}
        >
            <svg
                width="16"
                height="16"
                className="mr-1 text-black"
                fill="currentColor"
                aria-hidden="true"
                style={{ shapeRendering: "geometricPrecision" }}
            >
                <use href={`/icons/icon_definitions.svg#${iconId}`} />
            </svg>
            {label && <span className="text-xs text-gray-700">{label}</span>}
        </button>
    );
}


export default function TableHeader({
    isLoading,
    toggleSidebar,
    addBulkRows,
    sorting,
    setSorting,
    columns,
    columnVisibility,
    setVisibility
}: {
    isLoading: boolean;
    toggleSidebar: () => void;
    addBulkRows: (count: number) => void;
    sorting: SortingState;
    setSorting: (updater: SortingState | ((prev: SortingState) => SortingState)) => void;
    columns: ColumnData;
    columnVisibility: Record<string, boolean>;
    setVisibility: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}) {


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

    return (
        <div
            id="viewBar"
            role="region"
            aria-label="View configuration"
            className="flex items-center space-x-3 bg-white p-2 border-b border-gray-300"
        >
            <Button label="Views" iconId="List" onClick={toggleSidebar} />
            <div className="h-4 w-px bg-gray-300 mx-2"></div>
            <button

                role="button"
                className="flex items-center px-2 py-1 rounded hover:bg-gray-100 focus:outline-none"

            >
                <svg
                    width="16"
                    height="16"
                    className="flex-none"
                    fill="rgb(22, 110, 225)"
                    aria-hidden="true"
                    style={{ shapeRendering: "geometricPrecision" }}
                >
                    <use href={`/icons/icon_definitions.svg#GridFeature`} />
                </svg>

                <span
                    className="strong truncate flex-auto text-gray-700 text-sm  ml-1"
                    style={{ maxWidth: "200px" }}
                >
                    Grid View
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
            <ColumnVisibilityDropdown columns={columns} visibility={columnVisibility} setVisibility={setVisibility} />
            <Button label="Filter" iconId="FunnelSimple" />
            <Button label="Group" iconId="Group" />
            <SortingDropdown columns={columns} sorting={sorting} setSorting={setSorting} />
            <Button label="Color" iconId="PaintBucket" />
            <Button iconId="RowHeightSmall" />
            <Button label="Share and sync" iconId="ArrowSquareOut" />
            <Button
                label="15000 rows"
                iconId=""
                onClick={() => addBulkRows(15000)}
            />
        </div>
    );
}
