"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getGroupNavigation } from "@/lib/constants";

interface GroupRoutePrefetchProps {
  groupId: string;
}

export function GroupRoutePrefetch({ groupId }: GroupRoutePrefetchProps) {
  const router = useRouter();

  useEffect(() => {
    const routes = getGroupNavigation(groupId).map((item) => item.href);
    routes.push(`/group/${groupId}/settings`);

    for (const route of routes) {
      router.prefetch(route);
    }
  }, [groupId, router]);

  return null;
}
