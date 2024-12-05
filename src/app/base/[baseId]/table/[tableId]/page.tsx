"use client";

import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { api } from "~/trpc/react";

export default function Base() {
  const router = useRouter();
  const { baseId } = useParams();
  const { data: session } = useSession()

  const { data: baseData, isLoading } = api.post.getBaseById.useQuery(
    { baseId: parseInt(baseId as string, 10) },
    { enabled: !!baseId }
  );

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  return (
    <div className="base-layout">
      <header className="base-header flex items-center justify-between px-4 py-3 bg-[#107da3] border-b border-gray-300">
        <div className="flex items-center space-x-2">
          <button
            aria-label="Go home"
            className="flex items-center justify-center w-8 h-8"
            onClick={() => handleNavigation("/")}
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

          <div className="flex items-center space-x-2">
            <span className="font-semibold text-white text-md truncate">
              {isLoading ? "Loading..." : baseData?.name ?? "Untitled Base"}
            </span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              xmlns="http://www.w3.org/2000/svg"
              className="fill-current text-white"
            >
              <path d="M4 6l4 4 4-4"></path>
            </svg>
          </div>

          <nav className="flex items-center space-x-1 pl-2 text-xs">
            <button
              onClick={() => handleNavigation("/")}
              className="px-4 py-2 rounded-full text-white hover:bg-[#0e6a8b]"
            >
              Data
            </button>
            <button
              onClick={() => handleNavigation("/automations")}
              className="px-4 py-2 rounded-full text-white hover:bg-[#0e6a8b]"
            >
              Automations
            </button>
            <button
              onClick={() => handleNavigation("/interfaces")}
              className="px-4 py-2 rounded-full text-white hover:bg-[#0e6a8b]"
            >
              Interfaces
            </button>
            <button
              onClick={() => handleNavigation("/forms")}
              className="px-4 py-2 rounded-full text-white hover:bg-[#0e6a8b]"
            >
              Forms
            </button>
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          {session?.user?.image ? (
            <img
              src={session.user.image}
              alt="User Profile"
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center">
              B
            </div>
          )}
        </div>
      </header>


    </div>
  );
}
