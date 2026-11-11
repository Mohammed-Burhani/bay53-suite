"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ActivityPanel } from "@/components/bay53crm/shared/ActivityPanel";
import { AttachmentPanel } from "@/components/bay53crm/shared/AttachmentPanel";
import { RecordHeader } from "@/components/bay53crm/shared/RecordParts";
import {
  useAddCampaignActivity,
  useCampaignActivities,
  useCampaignAttachments,
  useDeleteCampaignActivity,
  useDeleteCampaignAttachment,
  useUpdateCampaignActivity,
  useUpdateCampaignNote,
  useUploadCampaignAttachment,
} from "@/lib/bay53crm/api/queries";
import { campaignApi, type CrmCampaign } from "@/lib/bay53crm/api";
import { attachmentFileName, requireFile, saveBlob, toActivityModel, toAttachmentForm } from "@/lib/bay53crm/records";
import { tolerateNotification } from "@/lib/bay53crm/save";

interface ProjectRecordsProps {
  project: CrmCampaign;
  users: { userName: string; fullName: string }[];
}

/** Runs a save or delete: a toast for the outcome, and false when it failed so a form can stay open. */
async function attempt(action: Promise<unknown>, done: string): Promise<boolean> {
  try {
    await tolerateNotification(action);
    toast.success(done);
    return true;
  } catch (e) {
    toast.error(e instanceof Error ? e.message : "Something went wrong");
    return false;
  }
}

/** A project keeps one note; it is edited here without opening the whole project form. */
function ProjectNote({ project }: { project: CrmCampaign }) {
  const updateNote = useUpdateCampaignNote();
  const saved = project.note ?? "";
  const [text, setText] = useState(saved);
  const changed = text !== saved;

  return (
    <div className="space-y-3">
      <RecordHeader title="Note" />
      <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a note about this project..." className="min-h-[120px] text-sm" />
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={() => setText(saved)} disabled={!changed || updateNote.isPending}>Reset</Button>
        <Button size="sm" disabled={!changed || updateNote.isPending} onClick={() => attempt(updateNote.mutateAsync({ id: project.id, note: text.trim() }), "Note saved")}>
          {updateNote.isPending ? "Saving..." : "Save note"}
        </Button>
      </div>
    </div>
  );
}

export function ProjectRecords({ project, users }: ProjectRecordsProps) {
  const campaignId = project.id;
  const activities = useCampaignActivities(campaignId);
  const attachments = useCampaignAttachments(campaignId);

  const addActivity = useAddCampaignActivity();
  const updateActivity = useUpdateCampaignActivity();
  const deleteActivity = useDeleteCampaignActivity();
  const upload = useUploadCampaignAttachment();
  const deleteAttachment = useDeleteCampaignAttachment();

  const count = (items?: unknown[]) => (items?.length ? <span className="ml-1 text-[10px] text-muted-foreground">{items.length}</span> : null);

  return (
    <Tabs defaultValue="activities" className="gap-3">
      <TabsList className="h-auto w-full flex-wrap justify-start">
        <TabsTrigger value="activities">Activities{count(activities.data)}</TabsTrigger>
        <TabsTrigger value="files">Files{count(attachments.data)}</TabsTrigger>
        <TabsTrigger value="note">Note</TabsTrigger>
      </TabsList>

      <TabsContent value="activities">
        <ActivityPanel
          items={activities.data ?? []}
          users={users}
          isLoading={activities.isLoading}
          isSaving={addActivity.isPending || updateActivity.isPending || deleteActivity.isPending}
          defaultDoneBy={project.assignedTo}
          onSave={(input, existing) =>
            existing
              ? attempt(updateActivity.mutateAsync({ ...toActivityModel(input, existing), campaignId }), "Activity updated")
              : attempt(addActivity.mutateAsync({ ...toActivityModel(input), campaignId }), "Activity added")
          }
          onDelete={(activity) => attempt(deleteActivity.mutateAsync(activity.id), "Activity deleted")}
        />
      </TabsContent>

      <TabsContent value="files">
        <AttachmentPanel
          items={attachments.data ?? []}
          isLoading={attachments.isLoading}
          isBusy={upload.isPending || deleteAttachment.isPending}
          onUpload={(file, name) => attempt(upload.mutateAsync(toAttachmentForm(campaignId, name, file)), "File uploaded")}
          onDownload={async (item) => {
            try {
              const blob = await requireFile(await campaignApi.downloadAttachmentFile({ filename: item.filePath }));
              saveBlob(blob, attachmentFileName(item));
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Could not download the file");
            }
          }}
          onDelete={(item) => attempt(deleteAttachment.mutateAsync(item.id), "File deleted")}
        />
      </TabsContent>

      <TabsContent value="note">
        {/* Keyed by the saved text so the editor starts from the new value after a save or a refetch. */}
        <ProjectNote key={project.note ?? ""} project={project} />
      </TabsContent>
    </Tabs>
  );
}
