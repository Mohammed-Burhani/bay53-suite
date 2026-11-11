import { describe, expect, it } from "vitest";
import type { CrmCustomMessage, CrmEmailSetting } from "./api/dto";
import {
  EMPTY_MAILBOX,
  EMPTY_MESSAGE,
  mailboxProblems,
  messageProblems,
  toMailboxInput,
  toMailboxModel,
  toMessageInput,
  toMessageModel,
} from "./settings";

const message: CrmCustomMessage = { id: 4, type: 3, shortName: "Welcome", heading: "Hello", text: "Hi there", isPublished: false };
const setting: CrmEmailSetting = {
  id: 2,
  accountId: 9,
  smtpServer: "smtp.example.com",
  smtpPort: 465,
  emailAddress: "crm@example.com",
  userName: "crm",
  senderName: "Bay53 CRM",
  imapServer: "imap.example.com",
  imapPort: "993",
  enableSsl: true,
};

describe("message templates", () => {
  it("builds a new template of the default type and trims the text", () => {
    expect(toMessageModel({ shortName: " Hi ", heading: " Hello ", text: " Body ", isPublished: true })).toEqual({
      id: 0,
      type: 1,
      shortName: "Hi",
      heading: "Hello",
      text: "Body",
      isPublished: true,
    });
  });

  it("keeps the id and type of the template being edited", () => {
    expect(toMessageModel(toMessageInput(message), message)).toMatchObject({ id: 4, type: 3, isPublished: false });
  });

  it("needs a short name and a text", () => {
    expect(messageProblems(EMPTY_MESSAGE)).toEqual(["Enter a short name", "Enter the message text"]);
    expect(messageProblems({ ...EMPTY_MESSAGE, shortName: "a", text: "b" })).toEqual([]);
  });
});

describe("mailboxes", () => {
  it("never carries a password over from the API into the form", () => {
    expect(toMailboxInput({ ...setting, password: "secret" }).password).toBe("");
  });

  it("sends the typed password and numeric port, and keeps the id and account of the mailbox being edited", () => {
    const model = toMailboxModel({ ...toMailboxInput(setting), password: "pw" }, setting);
    expect(model).toMatchObject({ id: 2, accountId: 9, smtpPort: 465, password: "pw", imapPort: "993", popServer: null });
  });

  it("falls back to the email address as the user name", () => {
    const model = toMailboxModel({ ...EMPTY_MAILBOX, emailAddress: "a@b.co", password: "x", smtpServer: "s" });
    expect(model.userName).toBe("a@b.co");
  });

  it("reports what is missing", () => {
    expect(mailboxProblems(EMPTY_MAILBOX)).toEqual(["Enter a valid email address", "Enter the password", "Enter the SMTP server"]);
    expect(mailboxProblems({ ...EMPTY_MAILBOX, emailAddress: "a@b.co", password: "x", smtpServer: "s", smtpPort: "70000" })).toEqual([
      "The SMTP port must be a number from 1 to 65535",
    ]);
    expect(mailboxProblems({ ...EMPTY_MAILBOX, emailAddress: "a@b.co", password: "x", smtpServer: "s" })).toEqual([]);
  });
});
