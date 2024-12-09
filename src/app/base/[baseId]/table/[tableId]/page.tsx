"use client";

import { useParams } from "next/navigation";

import { api } from "~/trpc/react";

import BaseHeader from "~/app/_components/BaseHeader";
import BaseTable from "~/app/_components/BaseTable";

export default function Base() {
  const { baseId, tableId } = useParams<{ baseId: string; tableId: string }>();
  const { data: baseData, refetch, isLoading } = api.post.getBaseById.useQuery(
    { baseId: parseInt(baseId, 10) },
    { enabled: !!baseId }
  );

  return (
    <div className="bg-[#f7f7f7] min-h-screen flex flex-col relative">

      <BaseHeader
        baseId={parseInt(baseId, 10)}
        tableId={tableId}
        baseData={baseData}
        isLoading={isLoading}
        refetch={refetch}

      />

      <BaseTable tableId={parseInt(tableId, 10)} />

    </div>

  );
}
