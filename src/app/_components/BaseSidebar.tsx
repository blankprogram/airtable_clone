export default function Sidebar() {
    return (
        <div className="bg-white border-r w-72 flex flex-col h-full">
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

            <div className="flex-grow"></div>
            <div className="px-6 pt-4">
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