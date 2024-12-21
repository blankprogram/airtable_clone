import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { type FilterValue, type ColumnFiltersState, type SortingState } from "./tableTypes";
import { useState } from "react";
import * as Switch from "@radix-ui/react-switch";
import { type RouterOutputs } from "~/trpc/react";
import { PiDotsSixVertical, PiTrashLight } from "react-icons/pi";
import { BsQuestionCircle } from "react-icons/bs";
import { AiOutlinePlus } from "react-icons/ai";
import { FiChevronDown, FiSearch } from "react-icons/fi";
import * as Select from "@radix-ui/react-select";


const RadixSelect = ({
    options,
    value,
    onChange,
    placeholder = "Select an option",
    width = "w-full",
    className = "",
}: {
    options: { value: string; label: string }[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    width?: string;
    className?: string
}) => (
    <Select.Root value={value} onValueChange={onChange}>
        <Select.Trigger
            className={`flex items-center justify-between px-2 py-1.5 text-xs hover:bg-[#f4f4f4] focus:outline-none ${width} ${className}`}
        >
            <Select.Value placeholder={placeholder} />
            <Select.Icon className="ml-2">
                <FiChevronDown className="text-gray-500" />
            </Select.Icon>
        </Select.Trigger>

        <Select.Portal>
            <Select.Content
                className="bg-white border border-gray-300 rounded shadow-lg p-3 w-40 text-xs"
                position="popper"
                sideOffset={5}
            >
                <Select.Viewport>
                    {options.map((option) => (
                        <Select.Item
                            key={option.value}
                            value={option.value}
                            className="outline-none flex items-center justify-between p-2 cursor-pointer hover:bg-[#f4f4f4] rounded"
                        >
                            <Select.ItemText>{option.label}</Select.ItemText>
                        </Select.Item>
                    ))}
                </Select.Viewport>
            </Select.Content>
        </Select.Portal>
    </Select.Root>
);


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
    const [searchTerm, setSearchTerm] = useState("");
    const [isOpen, setIsOpen] = useState(false);

    const filteredColumns = Array.from(columns.entries()).filter(([_, column]) =>
        column.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const updateSort = (index: number, updates: Partial<SortingState[0]>) => {
        setSorting((prev) =>
            prev.map((sort, i) => (i === index ? { ...sort, ...updates } : sort))
        );
    };

    const removeSort = (index: number) => {
        setSorting((prev) => prev.filter((_, i) => i !== index));
    };

    const addSort = () => {
        const firstAvailable = Array.from(columns.entries()).find(
            ([id]) => !sorting.some((sort) => sort.id === id.toString())
        );
        if (firstAvailable) {
            setSorting([...sorting, { id: firstAvailable[0].toString(), desc: false }]);
        }
    };

    return (
        <DropdownMenu.Root onOpenChange={setIsOpen}>
            <DropdownMenu.Trigger asChild>
                <button className="flex items-center px-2 py-1 rounded hover:bg-gray-100 focus:outline-none">
                    <svg
                        width="16"
                        height="16"
                        className="mr-1 text-black"
                        fill="currentColor"
                        aria-hidden="true"
                    >
                        <use href={`/icons/icon_definitions.svg#ArrowsDownUp`} />
                    </svg>
                    <span className="text-xs text-gray-700">Sort</span>
                </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
                <DropdownMenu.Content
                    className="bg-white border border-gray-300 rounded shadow-xl text-xs min-w-80 overflow-hidden"
                    align="start"
                    side="bottom"
                    sideOffset={4}
                >
                    <div className="p-5">
                        <div className="flex items-center gap-2">
                            <span className="font-medium">Sort By</span>
                            <BsQuestionCircle className="text-gray-500 h-3 w-3" />
                        </div>
                        <hr className="border-gray-300 my-4" />


                        <div className={`flex flex-col ${sorting.length === 0 ? "min-h-28" : "gap-2"}`}>
                            {sorting.length === 0 ? (
                                <>
                                    <div className="flex items-center gap-2 px-2 mb-4">
                                        <FiSearch
                                            className={`h-4 w-4 ${isOpen ? "text-blue-500" : "text-gray-300"
                                                }`}
                                        />
                                        <input
                                            type="text"
                                            placeholder="Find a field"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="flex-grow text-xs focus:outline-none"
                                            autoFocus={isOpen}
                                        />
                                    </div>
                                    <div>
                                        {filteredColumns.map(([id, { name }]) => (
                                            <button
                                                key={id}
                                                className="flex justify-between px-2 py-1 w-full text-xs text-gray-700 hover:bg-gray-100 rounded"
                                                onClick={() =>
                                                    setSorting((prev) => [
                                                        ...prev,
                                                        { id: id.toString(), desc: false },
                                                    ])
                                                }
                                            >
                                                {name}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <>
                                    {sorting.map(({ id, desc }, index) => (
                                        <div key={index} className="flex items-center gap-3">
                                            <div key={index} className="flex items-center gap-3">
                                                <RadixSelect
                                                    options={Array.from(columns.entries())
                                                        .filter(
                                                            ([colId]) =>
                                                                !sorting.some((sort, i) => sort.id === colId.toString() && i !== index)
                                                        )
                                                        .map(([colId, { name }]) => ({ value: colId.toString(), label: name }))}
                                                    value={id}
                                                    onChange={(value) => updateSort(index, { id: value })}
                                                    width="w-60"
                                                    className="border rounded"
                                                />

                                                <RadixSelect
                                                    options={
                                                        columns.get(Number(id))?.type === "TEXT"
                                                            ? [
                                                                { value: "asc", label: "A→Z" },
                                                                { value: "desc", label: "Z→A" },
                                                            ]
                                                            : [
                                                                { value: "asc", label: "1→9" },
                                                                { value: "desc", label: "9→1" },
                                                            ]
                                                    }
                                                    value={desc ? "desc" : "asc"}
                                                    onChange={(value) => updateSort(index, { desc: value === "desc" })}
                                                    width="w-32"
                                                    className="border rounded"
                                                />
                                            </div>

                                            <button
                                                onClick={() => removeSort(index)}
                                                className="text-gray-500 hover:text-black hover:bg-gray-100 p-2 rounded"
                                                aria-label="Remove Sort"
                                            >
                                                ✕
                                            </button>
                                            {sorting.length > 1 && (
                                                <PiDotsSixVertical className="h-4 w-4 text-gray-500 cursor-grab hover:text-black" />
                                            )}
                                        </div>
                                    ))}
                                    <button
                                        className="mt-3 flex items-center text-gray-500 hover:underline gap-2"
                                        onClick={addSort}
                                    >
                                        <AiOutlinePlus className="h-4 w-4" /> Add Another Sort
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                    {sorting.length > 0 && (
                        <div className="bg-[#f6f8fc] px-4 py-3 flex items-center">
                            <Switch.Root className="w-5 h-3 rounded-full bg-[#048a0e]">
                                <Switch.Thumb className="block w-2 h-2 rounded-full bg-white transform transition translate-x-2.5" />
                            </Switch.Root>
                            <span className="ml-2 text-xs">Automatically sort records</span>
                        </div>
                    )}
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

    const clearSearch = () => setSearchTerm("");

    return (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
                <button className="flex items-center p-1 rounded hover:bg-gray-100 focus:outline-none">
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
                    <span className="text-xs text-gray-700">Hide fields</span>
                </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
                <DropdownMenu.Content
                    className="bg-white border border-gray-300 rounded shadow-2xl p-4 text-sm w-80 "
                    align="start"
                    side="bottom"
                    sideOffset={4}
                >
                    <div className="flex flex-col space-y-3">
                        <div className="flex ">
                            <input
                                type="text"
                                placeholder="Find a field"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="flex-grow text-xs focus:outline-none"
                            />
                            <button
                                onClick={searchTerm ? clearSearch : undefined}
                                className="text-gray-500 hover:text-black"
                                aria-label={searchTerm ? "Clear search" : "Help"}
                            >
                                {searchTerm ? (
                                    <span>✕</span>
                                ) : (
                                    <BsQuestionCircle className="h-3 w-3" />
                                )}
                            </button>
                        </div>

                        <hr className="border-gray-300" />
                        <div className="space-y-2 min-h-20">
                            {filteredColumns.map(([id, column]) => (
                                <div
                                    key={id}
                                    className="flex items-center justify-between py-1"
                                >
                                    <div className="flex items-center flex-grow rounded hover:bg-gray-100 px-1 ">
                                        <Switch.Root
                                            className={`w-3 h-2 rounded-full ${visibility[id.toString()]
                                                ? "bg-[#048a0e]"
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
                                                className={`block w-1 h-1 rounded-full bg-white transform transition ${visibility[id.toString()]
                                                    ? "translate-x-1.5"
                                                    : "translate-x-0.5"
                                                    }`}
                                            />
                                        </Switch.Root>
                                        <span className="text-xs text-gray-700 ml-2">{column.name}</span>
                                    </div>
                                    <div className="flex-shrink-0 flex items-center">
                                        <PiDotsSixVertical
                                            className="h-4 w-4 text-gray-500 cursor-pointer hover:text-black"
                                            aria-hidden="true"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>


                        <div className="flex justify-between">
                            <button
                                onClick={handleHideAll}
                                className="text-xs text-gray-400 bg-gray-100 hover:bg-gray-200 hover:text-black px-11 py-1 rounded"
                            >
                                Hide All
                            </button>
                            <button
                                onClick={handleShowAll}
                                className="text-xs text-gray-400 bg-gray-100 hover:bg-gray-200 px-11 hover:text-black py-1 rounded"
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




export function FilterDropdown({
    columns,
    filter,
    setFilter,
}: {
    columns: Map<number, { name: string; type: "TEXT" | "NUMBER" }>;
    filter: ColumnFiltersState;
    setFilter: (filters: ColumnFiltersState) => void;
}) {
    const addCondition = () => {
        const firstColumnEntry = Array.from(columns.entries())[0];
        if (!firstColumnEntry) return;

        const [firstColId, firstCol] = firstColumnEntry;
        const defaultOperator = firstCol.type === "TEXT" ? "contains" : "equals";

        setFilter([
            ...filter,
            { id: firstColId.toString(), value: { operator: defaultOperator, value: "" } },
        ]);
    };

    const addConditionGroup = () => {
        console.log("Add Condition Group clicked");
    };

    const updateCondition = (
        index: number,
        key: "id" | "value",
        value: string | FilterValue
            
    ) => {
        const updatedFilters = [...filter];

        const filterToUpdate = updatedFilters[index];
        if (!filterToUpdate) {
            console.warn(`Filter at index ${index} does not exist.`);
            return;
        }

        if (key === "id") {
            const newColumn = columns.get(Number(value));
            if (newColumn) {
                const defaultOperator = newColumn.type === "TEXT" ? "contains" : "equals";
                updatedFilters[index] = {
                    id: value as string,
                    value: { operator: defaultOperator, value: "" },
                };
            }
        } else if (key === "value") {
            if (
                typeof value === "object" &&
                "operator" in value &&
                "value" in value &&
                filterToUpdate.value &&
                typeof filterToUpdate.value === "object"
            ) {
                filterToUpdate.value = {
                    ...filterToUpdate.value,
                    operator: value.operator,
                    value: value.value,
                };
            } else {
                console.warn(`Invalid value provided for filter update.`);
            }
        }

        setFilter(updatedFilters);
    };

    const removeCondition = (index: number) => {
        const updatedFilters = filter.filter((_, i) => i !== index);
        setFilter(updatedFilters);
    };

    const getOperators = (type: "TEXT" | "NUMBER") => {
        if (type === "TEXT") {
            return [
                { label: "contains...", value: "contains" },
                { label: "does not contain...", value: "not_contains" },
                { label: "is", value: "equals" },
                { label: "is empty", value: "is_empty" },
                { label: "is not empty", value: "is_not_empty" },
            ];
        }
        return [
            { label: "=", value: "equals" },
            { label: ">", value: "greater_than" },
            { label: "<", value: "less_than" },
        ];
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
                    >
                        <use href={`/icons/icon_definitions.svg#FunnelSimple`} />
                    </svg>
                    <span className="text-xs text-gray-700">Filter</span>
                </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
                <DropdownMenu.Content
                    className="bg-white border border-gray-300 rounded shadow-2xl p-4 text-xs space-y-4 min-w-80"
                    align="start"
                    side="bottom"
                    sideOffset={4}
                >
                    <div className="space-y-2 mr-8">
                        {filter.length > 0 ? (
                            <div className="text-gray-500">In this view, show records</div>
                        ) : (
                            <div className="flex items-center text-[#969aa0]">
                                <span>No filter conditions are applied</span>
                                <BsQuestionCircle className="ml-2" />
                            </div>
                        )}

                        {filter.map((condition, index) => {
                            const column = columns.get(Number(condition.id)) ?? { type: "TEXT" };
                            const operators = getOperators(column.type);

                            return (
                                <div key={index} className="flex items-center space-x-2">
                                    {index === 0 ? (
                                        <div className="flex items-center text-gray-500 px-2 w-16">Where</div>
                                    ) : (

                                        <RadixSelect
                                            options={[
                                                { value: "and", label: "and" },
                                                { value: "or", label: "or" },
                                            ]}
                                            value="and"
                                            onChange={(value) => console.log(`Selected: ${value}`)}
                                            placeholder="Select"
                                            width="w-full"
                                            className="border rounded"
                                        />


                                    )}


                                    <div className="flex items-center border rounded h-8">

                                        <RadixSelect
                                            options={Array.from(columns.entries()).map(([colId, col]) => ({
                                                value: colId.toString(),
                                                label: col.name,
                                            }))}
                                            value={condition.id}
                                            onChange={(value) => updateCondition(index, "id", value)}
                                            placeholder="Select a column"
                                            width="w-32"
                                            className="border-r"
                                        />
                                        <RadixSelect
                                            options={operators}
                                            value={condition.value.operator}
                                            onChange={(value) =>
                                                updateCondition(index, "value", {
                                                    operator: value as FilterValue["operator"],
                                                    value: condition.value.value ?? "",
                                                })
                                            }
                                            placeholder="Select an operator"
                                            width="w-32"
                                            className="border-r"
                                        />

                                        <input
                                            type={column.type === "NUMBER" ? "number" : "text"}
                                            value={condition.value.value}
                                            onChange={(e) =>
                                                updateCondition(index, "value", {
                                                    operator: condition.value.operator,
                                                    value: e.target.value,
                                                })
                                            }
                                            placeholder="Enter a value"
                                            className="w-32 h-full px-2 border-r focus:outline-none"
                                        />

                                        <button
                                            className="w-8 h-full flex items-center justify-center border-r text-black hover:bg-gray-100"
                                            onClick={() => removeCondition(index)}
                                        >
                                            <PiTrashLight className="w-4 h-4" />
                                        </button>

                                        <div className="w-8 h-full flex items-center justify-center text-black cursor-grab hover:bg-gray-100">
                                            <PiDotsSixVertical className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="flex font-semibold">
                        <button
                            onClick={addCondition}
                            className={`flex items-center ${filter.length > 0 ? "text-blue-500" : "text-gray-500"
                                }`}
                        >
                            <AiOutlinePlus className="mr-1" />
                            Add Condition
                        </button>
                        <button
                            onClick={addConditionGroup}
                            className="flex items-center text-gray-500 ml-3"
                        >
                            <AiOutlinePlus className="mr-1" />
                            Add Condition Group
                            <BsQuestionCircle className="ml-2" />
                        </button>
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
    setVisibility,
    filter,
    setFilter,
}: {
    isLoading: boolean;
    toggleSidebar: () => void;
    addBulkRows: (count: number) => void;
    sorting: SortingState;
    setSorting: (updater: SortingState | ((prev: SortingState) => SortingState)) => void;
    columns: ColumnData;
    columnVisibility: Record<string, boolean>;
    setVisibility: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
    filter: ColumnFiltersState;
    setFilter: React.Dispatch<React.SetStateAction<ColumnFiltersState>>;
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
            className="flex items-center gap-x-2 bg-white p-2 pl-3 border-b border-gray-300"
        >
            <Button label="Views" iconId="List" onClick={toggleSidebar} />
            <div className="h-4 w-px bg-gray-300 mx-1"></div>
            <button

                role="button"
                className="flex gap-x-1 items-center px-2 py-1.5 rounded hover:bg-gray-100 focus:outline-none"

            >
                <svg
                    width="16"
                    height="16"
                    className="flex-none mr-1"
                    fill="rgb(22, 110, 225)"
                    aria-hidden="true"
                    style={{ shapeRendering: "geometricPrecision" }}
                >
                    <use href={`/icons/icon_definitions.svg#GridFeature`} />
                </svg>

                <span
                    className=" flex-auto text-gray-700 text-xs font-semibold  "

                >
                    Grid view
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
            <FilterDropdown columns={columns} filter={filter} setFilter={setFilter} />
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
