"use client";


import { FiChevronDown, FiPlus } from "react-icons/fi";
import { SketchPicker } from "react-color";
import { useSession } from "next-auth/react";
import { type inferRouterOutputs } from "@trpc/server";
import { type AppRouter } from "~/server/api/root";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { api } from "~/trpc/react";

type RouterOutput = inferRouterOutputs<AppRouter>;

type Basetype = RouterOutput["post"]["getBaseById"];
export default function BaseHeader({
  baseId,
  tableId,
  baseData,
  refetch,

}: {
  baseId: string;
  tableId: string;
  baseData: Basetype | undefined;
  refetch: () => void;

}) {
  const router = useRouter();
  const { data: session } = useSession();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [localBaseData, setLocalBaseData] = useState<Basetype | undefined>(
    baseData
  );
  const searchParams = useSearchParams();
  const theme = searchParams.get("theme") ?? "407c4a";
  const name = searchParams.get("name") ?? "Untitled Base";
  const [newName, setNewName] = useState<string>(name);
  const [newTheme, setNewTheme] = useState<string>(theme);
  const themeColor = newTheme ? `#${newTheme}` : "#107da3";
  const hoverColor = newTheme ? `#${darkenHex(newTheme, 10)}` : "#0e6a8b";

  const { mutateAsync: updateBase } = api.post.updateBase.useMutation();
  const { mutateAsync: createTable } = api.post.createTableForBase.useMutation();
  const tables = localBaseData?.tables ?? [];



  useEffect(() => {
    if (baseData) {
      setLocalBaseData(baseData);
      setNewName(baseData.name);
      setNewTheme(baseData.theme);
    }
  }, [baseData]);


  const handleSave = async () => {
    const previousData = localBaseData;

    try {
      setLocalBaseData((prev) => (prev ? { ...prev, name: newName, theme: newTheme } : prev));
      await updateBase({
        baseId: parseInt(baseId, 10),
        name: newName,
        theme: newTheme,
      });
      refetch();
    } catch (error) {
      console.error("Failed to update base:", error);
      setLocalBaseData(previousData);
    }
  };

  const handleAddTable = async () => {
    const previousTables = localBaseData?.tables ?? [];

    try {
      const optimisticTable = {
        id: -1,
        name: `Table ${previousTables.length + 1}`,
      };

      setLocalBaseData((prev) => ({
        ...prev!,
        tables: [...prev!.tables, optimisticTable],
      }));

      const newTable = await createTable({
        baseId: parseInt(baseId, 10),
      });

      setLocalBaseData((prev) => ({
        ...prev!,
        tables: prev!.tables.map((table) =>
          table.id === -1 ? newTable : table
        ),
      }));

      refetch();
      router.push(`/base/${baseId}/table/${newTable.id}`);
    } catch (error) {
      console.error("Failed to create table:", error);
      setLocalBaseData((prev) => ({
        ...prev!,
        tables: previousTables,
      }));
    }
  };

  return (
    <header>
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ backgroundColor: themeColor }}
      >
        <div className="flex items-center space-x-2">
          <button
            aria-label="Go home"
            className="flex h-8 w-8 items-center justify-center"
            onClick={() => router.push("/")}
          >
            <svg
              width="24"
              height="20.4"
              viewBox="0 0 200 170"
              xmlns="http://www.w3.org/2000/svg"
              className="fill-current text-white"
            >
              <path d="M90.0389,12.3675 L24.0799,39.6605 C20.4119,41.1785 20.4499,46.3885 24.1409,47.8515 L90.3759,74.1175 C96.1959,76.4255 102.6769,76.4255 108.4959,74.1175 L174.7319,47.8515 C178.4219,46.3885 178.4609,41.1785 174.7919,39.6605 L108.8339,12.3675 C102.8159,9.8775 96.0559,9.8775 90.0389,12.3675"></path>
              <path d="M105.3122,88.4608 L105.3122,154.0768 C105.3122,157.1978 108.4592,159.3348 111.3602,158.1848 L185.1662,129.5368 C186.8512,128.8688 187.9562,127.2408 187.9562,125.4288 L187.9562,59.8128 C187.9562,56.6918 184.8092,54.5548 181.9082,55.7048 L108.1022,84.3528 C106.4182,85.0208 105.3122,86.6488 105.3122,88.4608"></path>
              <path d="M88.0781,91.8464 L66.1741,102.4224 L63.9501,103.4974 L17.7121,125.6524 C14.7811,127.0664 11.0401,124.9304 11.0401,121.6744 L11.0401,60.0884 C11.0401,58.9104 11.6441,57.8934 12.4541,57.1274 C12.7921,56.7884 13.1751,56.5094 13.5731,56.2884 C14.6781,55.6254 16.2541,55.4484 17.5941,55.9784 L87.7101,83.7594 C91.2741,85.1734 91.5541,90.1674 88.0781,91.8464"></path>
            </svg>
          </button>
          <div className="relative">
            <div
              className="flex cursor-pointer select-none items-center space-x-2"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <span className="text-md truncate font-semibold text-white">
                {newName}
              </span>
              <FiChevronDown className="text-white" />
            </div>
            {isDropdownOpen && (
              <div className="absolute left-0 top-10 z-10 w-72 rounded bg-white p-6 shadow-lg">
                <input
                  type="text"
                  className="mb-4 w-full rounded border px-2 py-1"
                  placeholder="Base Name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
                <div className="mb-4">
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Choose Theme Color
                  </label>
                  <SketchPicker
                    color={newTheme ? `#${newTheme}` : "#107da3"}
                    onChange={(color) => setNewTheme(color.hex.slice(1))}
                    disableAlpha
                  />
                </div>
                <button
                  onClick={handleSave}
                  className="w-full rounded bg-blue-500 py-2 text-white"
                >
                  Save
                </button>

              </div>

            )}
          </div>
          <nav className="flex items-center space-x-1 pl-2 text-xs">
            {["Data", "Automations", "Interfaces", "Forms"].map((item) => (
              <button
                key={item}
                className="rounded-full px-3 py-1 text-white hover:bg-[var(--hover-color)]"
                style={{ "--hover-color": hoverColor } as React.CSSProperties}
              >
                {item}
              </button>
            ))}
          </nav>
        </div>
        <div className="flex items-center space-x-4">
          {session?.user?.image ? (
            <img
              src={session.user.image}
              alt="User Profile"
              className="h-8 w-8 rounded-full outline outline-1 outline-white"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500 text-white">
              B
            </div>
          )}
        </div>
      </div>
      <div
        className="flex items-center justify-between px-2 text-white "
        style={{ backgroundColor: hoverColor }}
      >
        <div className="flex items-center ">
          {tables.map((table) => (
            <button
              key={table.id}
              className={`${table.id === parseInt(tableId, 10)
                ? "bg-white text-black px-3"
                : "bg-transparent text-white px-2"
                } flex items-center space-x-1 rounded-t-sm py-2  text-xs`}
              onClick={() => router.push(`/base/${baseId}/table/${table.id}`)}
            >
              <span>{table.name}</span>
              {table.id === parseInt(tableId, 10) && <FiChevronDown />}
            </button>
          ))}
          <div className="px-4">
            <FiChevronDown></FiChevronDown>
          </div>
          <button
            className="flex items-center space-x-1 py-1 text-xs"
            onClick={handleAddTable}
          >
            <FiPlus />
            <span>Add or Import</span>
          </button>
        </div>
        <div className="flex items-center justify-center space-x-4">
          <button className="flex items-center  p-2 text-xs ">
            <span>Extensions</span>
          </button>
          <button className="flex items-center space-x-1  p-2 text-xs ">
            <span>Tools</span>
            <FiChevronDown />
          </button>
        </div>
      </div>
    </header>
  );
}

function darkenHex(hex: string, percent: number) {
  const num = parseInt(hex, 16);
  const amt = Math.round(2.55 * percent);
  const r = (num >> 16) - amt;
  const g = ((num >> 8) & 0x00ff) - amt;
  const b = (num & 0x0000ff) - amt;

  return (
    (0x1000000 + Math.max(0, r) * 0x10000 + Math.max(0, g) * 0x100 + Math.max(0, b))
      .toString(16)
      .slice(1)
  );
}