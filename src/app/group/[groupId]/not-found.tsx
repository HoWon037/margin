import { EmptyState } from "@/components/ui/empty-state";

export default function GroupNotFound() {
  return (
    <EmptyState
      actionHref="/"
      actionLabel="처음으로"
      description="모임이 없거나 현재 계정으로 접근할 수 없습니다."
      title="모임을 찾을 수 없습니다"
    />
  );
}
