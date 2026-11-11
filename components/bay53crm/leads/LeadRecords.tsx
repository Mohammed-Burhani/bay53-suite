"use client";

import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ActivityPanel } from "@/components/bay53crm/shared/ActivityPanel";
import { AttachmentPanel } from "@/components/bay53crm/shared/AttachmentPanel";
import { FollowUpPanel } from "@/components/bay53crm/shared/FollowUpPanel";
import { NotePanel } from "@/components/bay53crm/shared/NotePanel";
import {
  useAddLeadActivity,
  useAddLeadFollowUp,
  useAddLeadNote,
  useDeleteLeadActivity,
  useDeleteLeadAttachment,
  useDeleteLeadFollowUp,
  useDeleteLeadNote,
  useLeadActivities,
  useLeadAttachments,
  useLeadDetailsCount,
  useLeadFollowUps,
  useLeadNotes,
  useUpdateLeadActivity,
  useUpdateLeadFollowUp,
  useUpdateLeadNote,
  useUploadLeadAttachment,
} from "@/lib/bay53crm/api/queries";
import { leadCommonApi, type CrmLead } from "@/lib/bay53crm/api";
import {
  attachmentFileName,
  requireFile,
  saveBlob,
  toActivityModel,
  toAttachmentForm,
  toFollowUpCompletion,
  toFollowUpModel,
} from "@/lib/bay53crm/records";
import { tolerateNotification } from "@/lib/bay53crm/save";
import { LeadEnquiry } from "./LeadEnquiry";
import { LeadHistory } from "./LeadHistory";

interface LeadRecordsProps {
  lead: CrmLead;
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

function TabLabel({ label, count }: { label: string; count?: number }) {
  return (
    <>
      {label}
      {count ? <span className="ml-1 text-[10px] text-muted-foreground">{count}</span> : null}
    </>
  );
}

export function LeadRecords({ lead, users }: LeadRecordsProps) {
  const leadId = lead.id;
  const { data: counts } = useLeadDetailsCount(leadId);
  const followUps = useLeadFollowUps(leadId);
  const activities = useLeadActivities(leadId);
  const notes = useLeadNotes(leadId);
  const attachments = useLeadAttachments(leadId);

  const addFollowUp = useAddLeadFollowUp();
  const updateFollowUp = useUpdateLeadFollowUp();
  const deleteFollowUp = useDeleteLeadFollowUp();
  const addActivity = useAddLeadActivity();
  const updateActivity = useUpdateLeadActivity();
  const deleteActivity = useDeleteLeadActivity();
  const addNote = useAddLeadNote();
  const updateNote = useUpdateLeadNote();
  const deleteNote = useDeleteLeadNote();
  const upload = useUploadLeadAttachment();
  const deleteAttachment = useDeleteLeadAttachment();

  return (
    <Tabs defaultValue="follow-ups" className="gap-3">
      <TabsList className="h-auto w-full flex-wrap justify-start">
        <TabsTrigger value="follow-ups"><TabLabel label="Follow-ups" count={counts?.leadFollowupCount} /></TabsTrigger>
        <TabsTrigger value="activities"><TabLabel label="Activities" count={counts?.leadActivityCount} /></TabsTrigger>
        <TabsTrigger value="notes"><TabLabel label="Notes" count={counts?.leadNoteCount} /></TabsTrigger>
        <TabsTrigger value="files"><TabLabel label="Files" count={counts?.leadAttachmentCount} /></TabsTrigger>
        <TabsTrigger value="enquiry">Enquiry</TabsTrigger>
        <TabsTrigger value="history">History</TabsTrigger>
      </TabsList>

      <TabsContent value="follow-ups">
        <FollowUpPanel
          items={followUps.data ?? []}
          users={users}
          isLoading={followUps.isLoading}
          isSaving={addFollowUp.isPending || updateFollowUp.isPending || deleteFollowUp.isPending}
          defaultAssignTo={lead.assignTo}
          onSave={(input, existing) =>
            existing
              ? attempt(updateFollowUp.mutateAsync(toFollowUpModel(leadId, input, existing)), "Follow-up updated")
              : attempt(addFollowUp.mutateAsync(toFollowUpModel(leadId, input)), "Follow-up added")
          }
          onToggleDone={(followUp) =>
            attempt(
              updateFollowUp.mutateAsync(toFollowUpCompletion(leadId, followUp, !followUp.isCompleted)),
              followUp.isCompleted ? "Follow-up reopened" : "Follow-up marked done"
            )
          }
          onDelete={(followUp) => attempt(deleteFollowUp.mutateAsync(followUp.id), "Follow-up deleted")}
        />
      </TabsContent>

      <TabsContent value="activities">
        <ActivityPanel
          items={activities.data ?? []}
          users={users}
          isLoading={activities.isLoading}
          isSaving={addActivity.isPending || updateActivity.isPending || deleteActivity.isPending}
          defaultDoneBy={lead.assignTo}
          onSave={(input, existing) =>
            existing
              ? attempt(updateActivity.mutateAsync({ ...toActivityModel(input, existing), leadId }), "Activity updated")
              : attempt(addActivity.mutateAsync({ ...toActivityModel(input), leadId }), "Activity added")
          }
          onDelete={(activity) => attempt(deleteActivity.mutateAsync(activity.id), "Activity deleted")}
        />
      </TabsContent>

      <TabsContent value="notes">
        <NotePanel
          items={notes.data ?? []}
          isLoading={notes.isLoading}
          isSaving={addNote.isPending || updateNote.isPending || deleteNote.isPending}
          onSave={(description, existing) =>
            existing
              ? attempt(updateNote.mutateAsync({ id: existing.id, leadId, description }), "Note updated")
              : attempt(addNote.mutateAsync({ id: 0, leadId, description }), "Note added")
          }
          onDelete={(note) => attempt(deleteNote.mutateAsync(note.id), "Note deleted")}
        />
      </TabsContent>

      <TabsContent value="files">
        <AttachmentPanel
          items={attachments.data ?? []}
          isLoading={attachments.isLoading}
          isBusy={upload.isPending || deleteAttachment.isPending}
          onUpload={(file, name) => attempt(upload.mutateAsync(toAttachmentForm(leadId, name, file)), "File uploaded")}
          onDownload={async (item) => {
            try {
              const blob = await requireFile(await leadCommonApi.downloadAttachmentFile({ filename: item.filePath }));
              saveBlob(blob, attachmentFileName(item));
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Could not download the file");
            }
          }}
          onDelete={(item) => attempt(deleteAttachment.mutateAsync(item.id), "File deleted")}
        />
      </TabsContent>

      <TabsContent value="enquiry">
        <LeadEnquiry lead={lead} />
      </TabsContent>

      <TabsContent value="history">
        <LeadHistory leadId={leadId} users={users} />
      </TabsContent>
    </Tabs>
  );
}
