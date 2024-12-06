"use client"
import type { Session } from "next-auth";
import Link from "next/link";
import { useState } from "react";
import { api } from "~/trpc/react";
import { type inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from '~/server/api/root';
import {
    HiOutlineMenu,
    HiOutlineBell,
    HiOutlineQuestionMarkCircle,
    HiOutlineSearch,
    HiOutlineChevronDown,
    HiOutlinePlus,
    HiOutlineBookOpen,
    HiOutlineShoppingBag,
    HiOutlineUpload,
} from "react-icons/hi";
import { useRouter } from "next/navigation";



type RouterOutput = inferRouterOutputs<AppRouter>;

type Base = RouterOutput["post"]["getBasesForUser"][number];

function Header({ session }: { session: Session }) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);


    const toggleDropdown = () => {
        setIsDropdownOpen((prev) => !prev);
    };

    return (
        <header className="sticky top-0 z-50 bg-white border-b border-gray-300 flex items-center justify-between px-3 py-2">
            <div className="flex items-center gap-4">
                <button className="hover:text-black text-gray-500" aria-label="Open menu">
                    <HiOutlineMenu className="h-5 w-5" />
                </button>
                <Link href="/" className="flex items-center text-lg font-bold hover:text-inherit">
                    <img src="/favicon.png" alt="AirTable Logo" className="h-7 w-7 mr-1" />
                    <span>Airtable</span>
                </Link>
            </div>

            <div className="flex-grow max-w-xs">
                <button className="flex items-center w-full border border-gray-300 rounded-full px-3 py-1.5 shadow-sm hover:shadow-md">
                    <HiOutlineSearch className="text-gray-400 h-4 w-4 flex-none mr-2" />
                    <span className="text-sm text-gray-500 flex-grow text-left">Search...</span>
                    <span className="text-xs text-gray-400 flex-none">ctrl K</span>
                </button>
            </div>

            <div className="flex items-center gap-3 relative">
                <button className="flex items-center gap-1 p-2 rounded-full hover:bg-gray-200" aria-label="Help">
                    <HiOutlineQuestionMarkCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Help</span>
                </button>
                <button className="p-1 rounded-full hover:bg-gray-200" aria-label="Notifications">
                    <HiOutlineBell className="h-5 w-5" />
                </button>
                <div className="relative">
                    <button
                        className="p-1"
                        aria-label="User Profile"
                        onClick={toggleDropdown}
                    >
                        <img
                            src={session.user?.image ?? undefined}
                            alt="User Profile"
                            className="h-7 w-7 rounded-full border border-gray-300"
                        />
                    </button>
                    {isDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-40 bg-white shadow-lg rounded-lg border border-gray-200">
                            <Link
                                href="/api/auth/signout"
                                className="block px-4 py-2 text-gray-700 hover:bg-gray-100 text-sm rounded-t"
                            >
                                Sign Out
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}

function Sidebar({ handleCreateBase }: { handleCreateBase: () => Promise<void> }) {
    return (
        <aside className="w-80 bg-white border-r border-t border-gray-300 flex flex-col py-4 px-3">
            <div className="flex flex-col gap-4">
                <button className="flex items-center justify-between w-full px-4 py-2 rounded hover:bg-gray-100">
                    <span className="text-left text-md">Home</span>
                    <HiOutlineChevronDown className="h-5 w-5" />
                </button>
                <button className="flex items-center justify-between w-full px-4 py-2 rounded hover:bg-gray-100">
                    <span className="text-left text-gray-800 text-md">All workspaces</span>
                    <div className="flex items-center gap-1">
                        <HiOutlinePlus className="h-5 w-5" />
                        <HiOutlineChevronDown className="h-5 w-5" />
                    </div>
                </button>
            </div>
            <div className="flex-grow"></div>
            <div className="border-t border-gray-200 pt-2">
                <nav className="flex flex-col gap-2">
                    <div className="flex flex-col">
                        <a href="#" className="flex items-center gap-2 p-2 rounded hover:bg-gray-100">
                            <HiOutlineBookOpen className="h-4 w-4" />
                            <span className="text-sm font-medium text-gray-700">Templates and Apps</span>
                        </a>
                        <a href="#" className="flex items-center gap-2 p-2 rounded hover:bg-gray-100">
                            <HiOutlineShoppingBag className="h-4 w-4 text-gray-600" />
                            <span className="text-sm font-medium text-gray-700">Marketplace</span>
                        </a>
                        <a href="#" className="flex items-center gap-2 p-2 rounded hover:bg-gray-100">
                            <HiOutlineUpload className="h-4 w-4 text-gray-600" />
                            <span className="text-sm font-medium text-gray-700">Import</span>
                        </a>
                    </div>
                    <button
                        onClick={handleCreateBase}
                        className="flex items-center justify-center gap-2 w-full p-2 rounded bg-[#166ee1] text-white"
                    >
                        <HiOutlinePlus className="h-4 w-4" />
                        <span className="text-sm font-medium">Create</span>
                    </button>
                </nav>
            </div>
        </aside>
    );
}





function MainContent({ handleCreateBase }: { handleCreateBase: () => Promise<void> }) {
    const [openMenu, setOpenMenu] = useState<number | null>(null);

    const utils = api.useContext();




    const deleteBaseMutation = api.post.deleteBase.useMutation({
        onMutate: async (deletedBase) => {
            await utils.post.getBasesForUser.cancel();
            const previousBases = utils.post.getBasesForUser.getData();

            utils.post.getBasesForUser.setData(undefined, (old) =>
                (old ?? []).filter((base) => base.id !== deletedBase.baseId)
            );

            return { previousBases };
        },
        onError: (err, deletedBase, context) => {
            if (context?.previousBases) {
                utils.post.getBasesForUser.setData(undefined, context.previousBases);
            }
        },
        onSettled: async () => {
            await utils.post.getBasesForUser.invalidate();
        },
    });

    const { data: fetchedBases = [], isLoading } = api.post.getBasesForUser.useQuery();

    const today = new Date().toISOString().split("T")[0];
    const todayBases = fetchedBases.filter(
        (base) => new Date(base.updatedAt).toISOString().split("T")[0] === today
    );
    const past7DaysBases = fetchedBases.filter(
        (base) => new Date(base.updatedAt).toISOString().split("T")[0] !== today
    );

    const BaseList = ({
        title,
        bases,
    }: {
        title: string;
        bases: Base[];
    }) => {

        const router = useRouter();

        const handleBaseClick = (baseId: number, firstTableId: number | null, theme: string, name: string) => {
            if (firstTableId) {
                router.push(
                    `/base/${baseId}/table/${firstTableId}?theme=${theme}&name=${encodeURIComponent(name)}`
                );
            } else {
                console.error("No tables available for this base");
            }
        };



        return (
            <div>
                <h2 className="text-sm mb-2">{title}</h2>
                <div className="grid grid-cols-5 gap-4 pb-4">
                    {bases.map((base) => (
                        <div
                            key={base.id}
                            className="cursor-pointer p-4 bg-white border border-gray-400 rounded-lg shadow-sm hover:shadow-md flex relative"
                            onClick={() => handleBaseClick(base.id, base.firstTableId, base.theme, base.name)}
                        >
                            <div
                                className="flex items-center justify-center w-14 h-14 rounded-xl"
                                style={{ backgroundColor: `#${base.theme}` }}
                            >
                                <span className="text-white text-lg">
                                    {base.name.slice(0, 2)}
                                </span>
                            </div>

                            <div className="ml-4 flex flex-col justify-center">
                                <h3 className="text-xs font-medium">{base.name}</h3>
                                <p className="text-xs text-gray-500">Base</p>
                            </div>

                            <div className="ml-auto relative">
                                <button
                                    className="absolute right-2 text-gray-600 hover:text-black"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenMenu((prev) => (prev === base.id ? null : base.id));
                                    }}
                                >
                                    ...
                                </button>

                                {openMenu === base.id && (
                                    <div className="absolute top-5 left-0  w-32 bg-white shadow-lg border border-gray-300 rounded-lg z-10">
                                        <button
                                            className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteBaseMutation.mutateAsync({ baseId: base.id }).catch((error) => {
                                                    console.error("Error deleting base:", error);
                                                });
                                            }}
                                        >
                                            Delete Base
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <main className="px-12 py-8">
            <h1 className="text-3xl font-bold mb-6">Home</h1>

            <div className="grid grid-cols-4 gap-4 mb-8">
                {[{
                    icon: (
                        <svg
                            width="20"
                            height="20"
                            style={{ fill: "rgb(221, 4, 168)" }}
                        >
                            <use href="/icons/icon_definitions.svg#AiFeature" />
                        </svg>
                    ),
                    title: "Start with AI",
                    description: "Turn your process into an app with data and interfaces using AI.",
                },
                {
                    icon: (
                        <svg
                            width="20"
                            height="20"
                            style={{ fill: "rgb(99, 73, 141)" }}
                        >
                            <use href="/icons/icon_definitions.svg#GridFour" />
                        </svg>
                    ),
                    title: "Start with templates",
                    description: "Select a template to get started and customize as you go.",
                },
                {
                    icon: (
                        <svg
                            width="20"
                            height="20"
                            style={{ fill: "rgb(13, 127, 120)" }}
                        >
                            <use href="/icons/icon_definitions.svg#ArrowUp" />
                        </svg>
                    ),
                    title: "Quickly upload",
                    description: "Easily migrate your existing projects in just a few minutes.",
                },
                {
                    icon: (
                        <svg
                            width="20"
                            height="20"
                            style={{ fill: "rgb(59, 102, 163)" }}
                        >
                            <use href="/icons/icon_definitions.svg#Table" />
                        </svg>
                    ),
                    title: "Start from scratch",
                    description: "Create a new blank base with custom tables, fields, and views.",
                    onClick: () => handleCreateBase(),
                }].map((box, index) => (
                    <div
                        key={index}
                        className="bg-white px-4 py-3 border border-gray-400 rounded-lg shadow-sm hover:shadow-md cursor-pointer"
                        onClick={box.onClick ?? undefined}
                    >
                        <div className="flex items-center gap-2 mb-1">
                            {box.icon}
                            <h2 className="text-md font-medium">{box.title}</h2>
                        </div>
                        <p className="text-xs text-gray-600">{box.description}</p>
                    </div>
                ))}
            </div>

            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <button className="flex items-center gap-2">
                        Opened by you
                        <HiOutlineChevronDown className="h-3 w-3" />
                    </button>
                    <button className="flex items-center gap-2">
                        Show all types
                        <HiOutlineChevronDown className="h-3 w-3" />
                    </button>
                </div>
                <div className="flex items-center gap-3">
                    <button>
                        <HiOutlineMenu className="h-5 w-5 text-gray-600" />
                    </button>
                    <button>
                        <svg
                            width="20"
                            height="20"
                            className="text-gray-600"
                            style={{ fill: "currentColor" }}
                        >
                            <use href="/icons/icon_definitions.svg#GridFour" />
                        </svg>
                    </button>
                </div>
            </div>

            {isLoading ? (
                <p>Loading...</p>
            ) : (
                <>
                    {todayBases.length > 0 && <BaseList title="Today" bases={todayBases} />}
                    {past7DaysBases.length > 0 && <BaseList title="Past 7 days" bases={past7DaysBases} />}
                </>
            )}
        </main>
    );
}


export function Dashboard({ session }: { session: Session }) {
    const utils = api.useContext();
    const router = useRouter();
    const createBaseMutation = api.post.createBaseForUser.useMutation({
        onMutate: async (newBase) => {
            await utils.post.getBasesForUser.cancel();
            const previousBases = utils.post.getBasesForUser.getData();

            const tempId = Date.now();

            utils.post.getBasesForUser.setData(undefined, (old) => [
                {
                    id: tempId,
                    name: newBase.name ?? "Untitled Base",
                    theme: newBase.theme ?? "407c4a",
                    updatedAt: new Date(),
                    firstTableId: null,
                } as Base,
                ...(old ?? []),
            ]);

            return { previousBases, tempId };
        },

        onSuccess: (data) => {
            if (data?.firstTableId) {
                router.push(`/base/${data.id}/table/${data.firstTableId}`);
            } else {
                console.error("No tables available for this base");
            }
        },

        onError: (err, newBase, context) => {
            if (context?.previousBases) {
                utils.post.getBasesForUser.setData(undefined, context.previousBases);
            }
        },

        onSettled: async () => {
            await utils.post.getBasesForUser.invalidate();
        },
    });





    const handleCreateBase = async () => {
        try {
            await createBaseMutation.mutateAsync({
            });
        } catch (error) {
            console.error("Error creating base:", error);
        }
    };

    return (
        <div className="min-h-screen bg-[#f9fafb] flex flex-col">
            <Header session={session} />
            <div className="flex flex-1">
                <Sidebar handleCreateBase={handleCreateBase} />
                <MainContent handleCreateBase={handleCreateBase} />
            </div>
        </div>
    );
}
