// Helpers for saving CRM records from the UI.

import { toast } from "sonner";
import { isNotificationFailure } from "./api";

/**
 * Await a save. When the server stored the record but failed to email the assignee, `crmHttp` still throws;
 * show a warning and resolve (undefined) so the caller carries on as if the save worked. Other errors are rethrown.
 */
export async function tolerateNotification<T>(save: Promise<T>): Promise<T | undefined> {
  try {
    return await save;
  } catch (error) {
    if (!isNotificationFailure(error)) throw error;
    // Same id every time: one warning, even when a form makes several calls.
    toast.warning("Saved, but the server could not send the notification email.", { id: "crm-notification-failed" });
    return undefined;
  }
}
