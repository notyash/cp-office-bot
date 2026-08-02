import { MetaMessage, MetaWebhookPayload } from "./whatsapp.js";

export type IncomingMessageType =
    "text"
  | "button"
  | "interactive"
  | "location"
  | "image"
  | "audio"
  | "video"
  | "document"
  | "sticker"
  | "contacts"
  | "reaction"
  | "unknown";

export type IncomingMessageDto = {
  messageId?: string;
  timestamp: string;

  // Always use this in app logic.
  // Can be WhatsApp wa_id OR Meta user_id.
  senderId: string;

  // WhatsApp number / wa_id when Meta provides it.
  senderWaId?: string;

  userName?: string;
  metaUserId?: string;

  botPhoneNumberId: string;
  botDisplayPhoneNumber?: string;

  type: IncomingMessageType;

  text?: string;

  contacts?: MetaMessage["contacts"];

  buttonReplyId?: string;
  buttonReplyTitle?: string;

  listReplyId?: string;
  listReplyTitle?: string;

  latitude?: number;
  longitude?: number;

  mediaId?: string;
  mediaMimeType?: string;
  mediaSha256?: string;

  raw: MetaWebhookPayload;
  flowResponse?: Record<string, unknown>;
};