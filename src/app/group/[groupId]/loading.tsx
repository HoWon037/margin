import { Card } from "@/components/ui/card";

export default function GroupLoading() {
  return (
    <div className="space-y-5">
      <Card className="h-40 animate-pulse bg-fill-alternative" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="h-32 animate-pulse bg-fill-alternative" />
        <Card className="h-32 animate-pulse bg-fill-alternative" />
      </div>
      <Card className="h-44 animate-pulse bg-fill-alternative" />
      <Card className="h-44 animate-pulse bg-fill-alternative" />
    </div>
  );
}
