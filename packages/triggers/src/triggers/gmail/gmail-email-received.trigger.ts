import { createTrigger } from "@open-agent-platform/triggers-sdk";
import { z } from "zod";
import { gmail_v1, google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import { HumanMessage } from "@langchain/core/messages";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const pubsubEnvelopeSchema = z.object({
  message: z.object({
    messageId: z.string(),
    data: z.string(),
  }),
});

const gmailPushDataSchema = z.object({
  emailAddress: z.string().email(),
  historyId: z.string(),
});

interface UserTokens {
  accessToken: string;
  refreshToken: string;
  expiryDate?: number;
}

const CREDENTIALS_FILE = path.join(process.cwd(), "credentials.json");

async function getUserTokens(userEmail: string): Promise<UserTokens | null> {
  if (!existsSync(CREDENTIALS_FILE)) return null;

  const fileContent = await readFile(CREDENTIALS_FILE, "utf8");
  const allTokens = JSON.parse(fileContent);
  return allTokens[userEmail] || null;
}

async function createGmailClient(userEmail: string) {
  const clientId = process.env.GMAIL_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GMAIL_OAUTH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "Missing OAuth credentials: GMAIL_OAUTH_CLIENT_ID and GMAIL_OAUTH_CLIENT_SECRET are required",
    );
  }

  const oauth2Client = new OAuth2Client(clientId, clientSecret);
  const userTokens = await getUserTokens(userEmail);

  if (!userTokens) {
    throw new Error(`No OAuth tokens found for user: ${userEmail}`);
  }

  oauth2Client.setCredentials({
    access_token: userTokens.accessToken,
    refresh_token: userTokens.refreshToken,
    expiry_date: userTokens.expiryDate,
  });

  return google.gmail({ version: "v1", auth: oauth2Client });
}

function getHeader(
  msg: gmail_v1.Schema$Message,
  name: string,
): string | undefined {
  const headers = msg?.payload?.headers ?? [];
  return (
    headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value ??
    undefined
  );
}

async function getNewMessages(
  gmail: gmail_v1.Gmail,
  userEmail: string,
  startHistoryId: string,
) {
  const { data } = await gmail.users.history.list({
    userId: userEmail,
    startHistoryId,
    historyTypes: ["messageAdded"],
  });

  const messageIds = new Set<string>();
  (data.history ?? []).forEach((h) => {
    (h.messagesAdded ?? []).forEach((ma) => {
      if (ma?.message?.id) messageIds.add(ma.message.id);
    });
  });

  return [...messageIds];
}

async function getMessageDetails(
  gmail: gmail_v1.Gmail,
  userEmail: string,
  messageId: string,
) {
  const { data } = await gmail.users.messages.get({
    userId: userEmail,
    id: messageId,
    format: "metadata",
    metadataHeaders: ["Subject", "From", "To", "Date"],
  });

  return {
    id: data.id,
    from: getHeader(data, "From") ?? "(unknown)",
    to: getHeader(data, "To"),
    subject: getHeader(data, "Subject") ?? "(no subject)",
    date: getHeader(data, "Date"),
    snippet: data.snippet ?? "",
  };
}

const lastHistoryId = new Map<string, string>();

export default createTrigger({
  id: "gmail.email.received",
  displayName: "Gmail: Email received",
  path: "/gmail",
  payload: pubsubEnvelopeSchema,

  async handler(envelope) {
    const decoded = JSON.parse(
      Buffer.from(envelope.message.data, "base64").toString("utf8"),
    );
    const { emailAddress, historyId } = gmailPushDataSchema.parse(decoded);

    const gmail = await createGmailClient(emailAddress);
    const previousHistoryId = lastHistoryId.get(emailAddress);

    if (!previousHistoryId) {
      lastHistoryId.set(emailAddress, historyId);
      return [];
    }

    try {
      const newMessageIds = await getNewMessages(
        gmail,
        emailAddress,
        previousHistoryId,
      );
      lastHistoryId.set(emailAddress, historyId);

      if (newMessageIds.length === 0) {
        return [];
      }

      const messages = await Promise.all(
        newMessageIds.map(async (id) => {
          const details = await getMessageDetails(gmail, emailAddress, id);
          return new HumanMessage({
            content: `New email received
From: ${details.from}
Subject: ${details.subject}
${details.snippet}`,
            additional_kwargs: {
              source: "gmail",
              emailAddress,
              messageId: details.id,
            },
          });
        }),
      );

      return messages;
    } catch (error: any) {
      if (error?.code === 404) {
        lastHistoryId.set(emailAddress, historyId);
        return [];
      }
      throw error;
    }
  },
});
