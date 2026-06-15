"use client";

import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { GroupForm } from "@/components/master/groups/GroupForm";
import { useGroupCreate } from "@/lib/hooks/useGroups";
import { getApiErrorMessage } from "@/lib/utils/api-error";

export default function CreateGroupPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { mutate: createGroup, isPending } = useGroupCreate();

  const handleSubmit = (values: { name: string; parentId: number }) => {
    createGroup(
      { id: 0, name: values.name, parentId: values.parentId },
      {
        onSuccess: () => {
          toast.success("Group created successfully");
          queryClient.invalidateQueries({ queryKey: ["parent-groups"] });
          router.push("/master/groups");
        },
        onError: (error) => {
          toast.error(getApiErrorMessage(error, "Failed to create group"));
          console.error("[.NET API] Group/Create failed:", error);
        },
      }
    );
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create Group</h1>
          <p className="text-sm text-muted-foreground">Add a new account group</p>
        </div>
      </div>

      <GroupForm
        initialValues={{ name: "", parentId: 0 }}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        submitLabel={isPending ? "Creating..." : "Create Group"}
      />
    </div>
  );
}
