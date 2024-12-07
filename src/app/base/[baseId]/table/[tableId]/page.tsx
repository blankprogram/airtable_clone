"use client";

import { useParams } from "next/navigation";

import { api } from "~/trpc/react";

import BaseHeader from "~/app/_components/BaseHeader";



export default function Base() {
  const { baseId, tableId } = useParams<{ baseId: string; tableId: string }>();
  const { data: baseData, refetch } = api.post.getBaseById.useQuery(
    { baseId: parseInt(baseId, 10) },
    { enabled: !!baseId }
  );

  return (
    <div className="base-layout">
      <BaseHeader
        baseId={baseId}
        tableId={tableId}
        baseData={baseData}
        refetch={refetch}
      />
    </div>
  );
}
