import { Suspense } from "react";
import { AdminDashboard } from "@/components/activity/AdminDashboard";
import { Skeleton } from "@/components/activity/states";

// useSearchParams in the dashboard needs a Suspense boundary.
export default function AdminActivityPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <AdminDashboard />
    </Suspense>
  );
}
