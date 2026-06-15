"use client";

import { useRouter, useParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { GroupForm } from "@/components/master/groups/GroupForm";
import { useGroupById, useGroupUpdate } from "@/lib/hooks/useGroups";
import { getApiErrorMessage } from "@/lib/utils/api-error";

export default function EditGroupPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const groupId = Number(params.id);

  const { data: group, isLoading, isError } = useGroupById(groupId);
  const { mutate: updateGroup, isPending } = useGroupUpdate();

  const handleSubmit = (values: { name: string; parentId: number }) => {
    updateGroup(
      { id: groupId, name: values.name, parentId: values.parentId },
      {
        onSuccess: () => {
          toast.success("Group updated successfully");
          queryClient.invalidateQueries({ queryKey: ["parent-groups"] });
          queryClient.invalidateQueries({ queryKey: ["group", groupId] });
          router.push("/master/groups");
        },
        onError: (error) => {
          toast.error(getApiErrorMessage(error, "Failed to update group"));
          console.error("[.NET API] Group/Update failed:", error);
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !group) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-muted-foreground">Group not found</p>
        <Button variant="outline" onClick={() => router.push("/master/groups")}>
          Back to Groups
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Group</h1>
          <p className="text-sm text-muted-foreground">Update group details for {group.name}</p>
        </div>
      </div>

      <GroupForm
        initialValues={{ name: group.name, parentId: group.parentId }}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        submitLabel={isPending ? "Saving..." : "Save Changes"}
        excludeGroupId={groupId}
      />
    </div>
  );
}
