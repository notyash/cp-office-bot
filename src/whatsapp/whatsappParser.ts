import { IncomingMessageDto, IncomingMessageType } from "../types/incomingMessageDto.js";
import { MetaWebhookPayload } from "../types/whatsapp.js";

function mapMessageType(metaType: string): IncomingMessageType {
  switch (metaType) {
    case "text":
    case "button":
    case "interactive":
    case "location":
    case "image":
    case "audio":
    case "video":
    case "document":
    case "sticker":
    case "contacts":
    case "reaction":
      return metaType;

    default:
      return "unknown";
  }
}

export function parseIncomingMessage(
  payload: MetaWebhookPayload
): IncomingMessageDto | null {
  // Meta wraps webhook events like:
  // payload.entry[0].changes[0].value.messages[0]
  const change = payload.entry?.[0]?.changes?.[0];

  // Ignore malformed payloads or non-message webhook events.
  if (!change || change.field !== "messages") return null;

  const value = change.value;

  // Status events are delivery/read/sent updates, not incoming user messages.
  if (value.statuses?.[0]) return null;

  const metadata = value.metadata;
  const contact = value.contacts?.[0];
  const message = value.messages?.[0];

  // If there is no actual incoming message, we cannot build a DTO.
  if (!message) return null;

  const type = mapMessageType(message.type);

  // WhatsApp sender ID/number when Meta provides it.
  const senderWaId = message.from ?? contact?.wa_id;

  // Meta user ID is separate from WhatsApp wa_id.
  const metaUserId = message.from_user_id ?? contact?.user_id;

  // Use the best available stable sender identifier.
  const senderId = senderWaId ?? metaUserId;
  if (!senderId) return null;

  const dto: IncomingMessageDto = {
    messageId: message.id,
    timestamp: message.timestamp,
    senderId,
    botPhoneNumberId: metadata.phone_number_id,
    type,
    raw: payload,
  };

  // Optional fields: only assign when they actually exist.
  // This avoids exactOptionalPropertyTypes errors.
  if (senderWaId) {
    dto.senderWaId = senderWaId;
  }

  if (contact?.profile?.name) {
    dto.userName = contact.profile.name;
  }

  if (metaUserId) {
    dto.metaUserId = metaUserId;
  }

  if (metadata.display_phone_number) {
    dto.botDisplayPhoneNumber = metadata.display_phone_number;
  }

  // Text message body.
  if (message.text?.body !== undefined) {
    dto.text = message.text.body;
  }

  // Shared contact card message.
  if (message.type === "contacts" && message.contacts) {
    dto.contacts = message.contacts;
  }

  return dto;
}