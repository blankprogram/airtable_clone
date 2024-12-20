import { api } from "~/trpc/react";
import { type ColumnFiltersState, type SortingState, type ViewData } from "./tableTypes";

export default function Sidebar({
    views,
    setViews,
    currentViewId,
    setCurrentViewId,
    tableId,
}: {
    views: ViewData[];
    setViews: React.Dispatch<React.SetStateAction<ViewData[]>>;
    currentViewId: number | null;
    setCurrentViewId: (id: number | null) => void;
    tableId: number;
}) {
    const createViewMutation = api.post.createViewForTable.useMutation();

    const handleCreateView = () => {
        const temporaryViewId = -(Date.now());
        const newView: ViewData = {
            id: temporaryViewId,
            name: `View ${views.length + 1}`,
            sorting: [],
            filters: [],
            columnVisibility: {},
        };

        setViews((prev) => [...prev, newView]);

        createViewMutation.mutate(
            { tableId, name: newView.name },
            {
                onSuccess: (createdView) => {
                    setViews((prev) =>
                        prev.map((view) =>
                            view.id === temporaryViewId ? createdView : view
                        )
                    );
                    setCurrentViewId(createdView.id);
                },
                onError: () => {
                    setViews((prev) => prev.filter((view) => view.id !== temporaryViewId));
                },
            }
        );
    };

    return (
        <div className="bg-white border-r w-72 flex flex-col h-full">
            <div className="py-4 px-2">
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

                <div className="space-y-2">
                    {views.map((view) => (
                        <button
                            key={view.id}
                            onClick={() => setCurrentViewId(view.id)}
                            className={`flex items-center justify-between w-full px-3 py-2 rounded-md ${currentViewId === view.id ? "bg-blue-200" : "hover:bg-gray-100"
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <svg
                                    width="16"
                                    height="16"
                                    fill="currentColor"
                                    aria-hidden="true"
                                    className="text-blue-500"
                                >
                                    <use href={`/icons/icon_definitions.svg#GridFeature`} />
                                </svg>
                                <p className="text-xs font-medium">{view.name}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-grow"></div>
            <div className="px-6 pt-4">
                <div className="border-b border-gray-300 mb-4"></div>
                <div className="flex items-center">
                    <p className="text-sm font-semibold ml-3">Create</p>
                </div>
                <div className="py-2">
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
                            <button
                                onClick={handleCreateView}
                                className="flex items-center justify-between w-full px-3 py-2 rounded-md hover:bg-gray-100"
                            >
                                <div className="flex items-center gap-3">
                                    {view.icon && (
                                        <svg
                                            width="16"
                                            height="16"
                                            fill="currentColor"
                                            aria-hidden="true"
                                            className={view.color}
                                        >
                                            <use href={`/icons/icon_definitions.svg#${view.icon}`} />
                                        </svg>
                                    )}
                                    <p className="text-sm font-medium">{view.name}</p>
                                </div>
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

                            {view.name === "New Section" && (
                                <>
                                    <div className="border-b border-gray-300 my-4"></div>
                                    <button
                                        onClick={handleCreateView}
                                        className="flex items-center justify-between w-full px-3 py-2 rounded-md hover:bg-gray-100"
                                    >
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
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
}