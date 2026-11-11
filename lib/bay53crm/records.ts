// Helpers for the records kept under a lead or a project: follow-ups, activities, attachments.

import type { CrmActivity, CrmLeadFollowUp } from "./api/dto";
import type { CrmSchemas } from "./api/types";

/** The numeric type the stage API accepts for new activities and follow-ups; it has no lookup endpoint. */
export const RECORD_TYPE = 1;

/** Today as yyyy-mm-dd, the value of a date input. */
export const todayInput = (): string => new Date().toISOString().slice(0, 10);

/** yyyy-mm-dd part of an API date-time, for date inputs. */
export const dayOf = (value?: string | null): string => (value ? value.slice(0, 10) : "");

/** An API date-time at the start of the given day; undefined when there is no day. */
export const dayStart = (day: string): string | undefined => (day ? `${day}T00:00:00` : undefined);

// ---- Follow-ups ----

export interface FollowUpInput {
  description: string;
  /** yyyy-mm-dd */
  dueDate: string;
  assignTo: string;
}

export const toFollowUpModel = (
  leadId: number,
  input: FollowUpInput,
  existing?: CrmLeadFollowUp
): CrmSchemas["LeadFollowUpCreateViewModel"] => ({
  id: existing?.id ?? 0,
  leadId,
  type: existing?.type ?? RECORD_TYPE,
  title: existing?.title || "Follow up",
  description: input.description.trim(),
  assignTo: input.assignTo || null,
  dueDate: dayStart(input.dueDate),
  date: existing?.date ?? dayStart(todayInput()),
  contactNo: existing?.contactNo || null,
  isCompleted: existing?.isCompleted ?? false,
});

/** The same follow-up with its done flag changed. Everything else is sent back as it was read. */
export const toFollowUpCompletion = (
  leadId: number,
  followUp: CrmLeadFollowUp,
  isCompleted: boolean
): CrmSchemas["LeadFollowUpCreateViewModel"] => ({
  id: followUp.id,
  leadId,
  type: followUp.type,
  title: followUp.title ?? null,
  description: followUp.description ?? null,
  assignTo: followUp.assignTo ?? null,
  dueDate: followUp.dueDate,
  date: followUp.date,
  contactNo: followUp.contactNo || null,
  isCompleted,
});

/** A pending follow-up whose due day has passed. */
export const isOverdue = (followUp: CrmLeadFollowUp, now = todayInput()): boolean =>
  !followUp.isCompleted && dayOf(followUp.dueDate) < now;

// ---- Activities ----

export interface ActivityInput {
  description: string;
  /** yyyy-mm-dd */
  date: string;
  doneBy: string;
}

type ActivityModel = Omit<CrmSchemas["LeadActivityCreateViewModel"], "leadId">;

/** The fields shared by lead and campaign activities; the caller adds the lead or campaign id. */
export const toActivityModel = (input: ActivityInput, existing?: CrmActivity): ActivityModel => ({
  id: existing?.id ?? 0,
  type: existing?.type ?? RECORD_TYPE,
  title: existing?.title ?? "",
  description: input.description.trim(),
  doneBy: input.doneBy || null,
  completedOn: dayStart(input.date),
  date: dayStart(input.date),
  contactNo: existing?.contactNo || null,
});

// ---- Attachments ----

/** The multipart body of the two upload endpoints: the file, the lead or project id and a label. */
export function toAttachmentForm(ownerId: number, name: string, file: File): FormData {
  const form = new FormData();
  form.append("files", file);
  form.append("id", String(ownerId));
  form.append("name", name.trim() || file.name);
  return form;
}

/** The label with the stored file's extension, so a downloaded file opens with the right program. */
export function attachmentFileName(attachment: { name: string; filePath: string }): string {
  const dot = attachment.filePath.lastIndexOf(".");
  const extension = dot >= 0 ? attachment.filePath.slice(dot) : "";
  return attachment.name.toLowerCase().endsWith(extension.toLowerCase()) ? attachment.name : `${attachment.name}${extension}`;
}

/**
 * The download endpoints answer 200 with a JSON error body when the file cannot be read (seen on stage), so a
 * JSON blob is an error to show, not a file to save.
 */
export async function requireFile(blob: Blob): Promise<Blob> {
  if (!blob.type.includes("json")) return blob;
  let message = "The server could not read the file";
  try {
    const body = JSON.parse(await blob.text());
    if (body?.message) message = String(body.message);
  } catch {
    // keep the default message
  }
  throw new Error(message);
}

/** Save a blob through a temporary link, as the browser's own download would. */
export function saveBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
