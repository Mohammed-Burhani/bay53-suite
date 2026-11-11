import { describe, expect, it } from "vitest";
import type { CrmLeadFollowUp } from "./api/dto";
import {
  attachmentFileName,
  dayOf,
  dayStart,
  isOverdue,
  requireFile,
  toActivityModel,
  toAttachmentForm,
  toFollowUpCompletion,
  toFollowUpModel,
} from "./records";

const followUp = (overrides: Partial<CrmLeadFollowUp> = {}): CrmLeadFollowUp => ({
  id: 394,
  type: 4,
  title: "Meet",
  description: "Meet the consultant",
  assignTo: "arbaz",
  dueDate: "2024-06-15T00:00:00",
  date: "2024-06-08T00:00:00",
  isCompleted: false,
  ...overrides,
});

describe("dates", () => {
  it("takes the day of an API date-time and builds a start of day", () => {
    expect(dayOf("2024-06-15T10:30:00")).toBe("2024-06-15");
    expect(dayOf(undefined)).toBe("");
    expect(dayStart("2024-06-15")).toBe("2024-06-15T00:00:00");
    expect(dayStart("")).toBeUndefined();
  });
});

describe("follow-ups", () => {
  it("builds a new follow-up with the default type and title", () => {
    const model = toFollowUpModel(7, { description: "  Call back  ", dueDate: "2026-12-01", assignTo: "rani" });
    expect(model).toMatchObject({
      id: 0,
      leadId: 7,
      type: 1,
      title: "Follow up",
      description: "Call back",
      assignTo: "rani",
      dueDate: "2026-12-01T00:00:00",
      isCompleted: false,
    });
  });

  it("keeps the type, title, date and done flag of the follow-up being edited", () => {
    const model = toFollowUpModel(7, { description: "Changed", dueDate: "2026-12-02", assignTo: "" }, followUp());
    expect(model).toMatchObject({ id: 394, type: 4, title: "Meet", date: "2024-06-08T00:00:00", assignTo: null });
  });

  it("changes only the done flag when completing", () => {
    const model = toFollowUpCompletion(7, followUp(), true);
    expect(model).toMatchObject({ id: 394, type: 4, description: "Meet the consultant", dueDate: "2024-06-15T00:00:00", isCompleted: true });
  });

  it("is overdue only while pending and past its day", () => {
    expect(isOverdue(followUp(), "2024-06-16")).toBe(true);
    expect(isOverdue(followUp(), "2024-06-15")).toBe(false);
    expect(isOverdue(followUp({ isCompleted: true }), "2024-06-16")).toBe(false);
  });
});

describe("activities", () => {
  it("builds a new activity on the chosen day", () => {
    expect(toActivityModel({ description: " Called ", date: "2026-11-01", doneBy: "rani" })).toMatchObject({
      id: 0,
      type: 1,
      description: "Called",
      doneBy: "rani",
      completedOn: "2026-11-01T00:00:00",
      date: "2026-11-01T00:00:00",
    });
  });
});

describe("attachments", () => {
  it("builds the multipart body with the file, the owner id and the label", () => {
    const file = new File(["x"], "offer.xlsx");
    const form = toAttachmentForm(6620, "  Offer for FF ", file);
    expect(form.get("id")).toBe("6620");
    expect(form.get("name")).toBe("Offer for FF");
    expect((form.get("files") as File).name).toBe("offer.xlsx");
    expect(toAttachmentForm(1, "   ", file).get("name")).toBe("offer.xlsx");
  });

  it("adds the stored extension to the label once", () => {
    expect(attachmentFileName({ name: "Offer for FF", filePath: "33ea.xlsx" })).toBe("Offer for FF.xlsx");
    expect(attachmentFileName({ name: "plan.PDF", filePath: "72.pdf" })).toBe("plan.PDF");
    expect(attachmentFileName({ name: "notes", filePath: "noextension" })).toBe("notes");
  });

  it("turns a JSON body into an error and lets a file through", async () => {
    const error = new Blob([JSON.stringify({ hasError: true, message: "Index was outside the bounds of the array." })], {
      type: "application/json",
    });
    await expect(requireFile(error)).rejects.toThrow("Index was outside the bounds of the array.");
    const file = new Blob(["abc"], { type: "application/pdf" });
    await expect(requireFile(file)).resolves.toBe(file);
  });
});
