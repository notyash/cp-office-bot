import { MetaWebhookPayload } from "./whatsapp.js";

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

  userWaId: string; // user's WhatsApp number / wa_id
  userName?: string;
  metaUserId?: string;

  botPhoneNumberId: string;
  botDisplayPhoneNumber?: string;

  type: IncomingMessageType;

  text?: string;

  buttonReplyId?: string;
  buttonReplyTitle?: string;

  listReplyId?: string;
  listReplyTitle?: string;

  latitude?: number;
  longitude?: number;

  mediaId?: string;
  mediaMimeType?: string; // mime is like image/jpeg (main type/sub type)

  raw: MetaWebhookPayload;
};