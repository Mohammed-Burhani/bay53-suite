import { describe, expect, it } from "vitest";
import type { CrmMessage } from "./api/dto";
import {
  addressLabel,
  composeProblems,
  EMPTY_COMPOSE,
  invalidRecipients,
  mailIdOf,
  messageKey,
  newestFirst,
  parseRecipients,
  previewOf,
  recipientsLabel,
  replyTo,
  toSendForm,
  unreadCount,
} from "./email";

const message = (overrides: Partial<CrmMessage> = {}): CrmMessage => ({
  messageId: { id: 5, validity: 11 },
  isRead: false,
  isFlagged: false,
  isBookMark: false,
  date: "2026-11-01T10:00:00",
  ...overrides,
});

describe("addresses", () => {
  it("prefers the display name and falls back to the address", () => {
    expect(addressLabel({ name: " Rani ", address: "rani@x.co" })).toBe("Rani");
    expect(addressLabel({ address: "rani@x.co" })).toBe("rani@x.co");
    expect(addressLabel(undefined)).toBe("Unknown sender");
    expect(recipientsLabel([{ name: "A" }, { address: "b@x.co" }])).toBe("A, b@x.co");
  });

  it("splits recipients by comma, semicolon or line and drops blanks and repeats", () => {
    expect(parseRecipients("a@x.co; b@x.co,\n a@x.co , ")).toEqual(["a@x.co", "b@x.co"]);
    expect(invalidRecipients("a@x.co, nope, b@y")).toEqual(["nope", "b@y"]);
  });
});

describe("messages", () => {
  it("uses the server id the endpoints expect and a stable key", () => {
    expect(mailIdOf(message())).toEqual({ id: 5, validity: 11 });
    expect(mailIdOf(message({ mailKitMessage: { id: 9, validity: 2 } }))).toEqual({ id: 9, validity: 2 });
    expect(messageKey(message())).toBe("11-5");
  });

  it("previews the text, or the HTML without markup and styles, cut to a length", () => {
    expect(previewOf(message({ textBody: "  Hello \n world " }))).toBe("Hello world");
    expect(previewOf(message({ htmlBody: "<style>p{}</style><p>Hi&nbsp;<b>there</b></p>" }))).toBe("Hi there");
    expect(previewOf(message({ textBody: "x".repeat(50) }), 10)).toBe("xxxxxxxxx…");
  });

  it("sorts newest first and counts unread", () => {
    const a = message({ date: "2026-11-01T10:00:00" });
    const b = message({ messageId: { id: 6, validity: 11 }, date: "2026-11-02T10:00:00", isRead: true });
    expect(newestFirst([a, b])).toEqual([b, a]);
    expect(unreadCount([a, b])).toBe(1);
  });

  it("answers with the sender as recipient and one Re:", () => {
    expect(replyTo(message({ subject: "Offer", fromAddress: { address: "c@x.co" } }))).toMatchObject({ to: "c@x.co", subject: "Re: Offer" });
    expect(replyTo(message({ subject: "RE: Offer" })).subject).toBe("RE: Offer");
  });
});

describe("composing", () => {
  it("asks for a recipient, valid addresses and some content", () => {
    expect(composeProblems(EMPTY_COMPOSE)).toEqual(["Add at least one recipient", "Write a subject or a message"]);
    expect(composeProblems({ ...EMPTY_COMPOSE, to: "a@x.co", cc: "bad", subject: "Hi" })).toEqual(['Cc: "bad" is not a valid address']);
    expect(composeProblems({ ...EMPTY_COMPOSE, to: "a@x.co", subject: "Hi" })).toEqual([]);
  });

  it("builds the multipart body and leaves out empty cc and bcc", () => {
    const file = new File(["x"], "a.txt");
    const form = toSendForm({ to: "a@x.co; b@x.co", cc: "", bcc: "c@x.co", subject: " Hi ", body: "Text", files: [file] });
    expect(form.get("to")).toBe("a@x.co,b@x.co");
    expect(form.has("cc")).toBe(false);
    expect(form.get("bcc")).toBe("c@x.co");
    expect(form.get("subject")).toBe("Hi");
    expect(form.get("content")).toBe("Text");
    expect(form.getAll("files")).toHaveLength(1);
  });
});
