import { IncomingMessageDto, IncomingMessageType } from "../types/incomingMessageDto.js";
import { MetaMediaObject, MetaWebhookPayload } from "../types/whatsapp.js";

// Meta's Flow nfm_reply payload includes numeric "id" fields for uploaded
// media (e.g. from DocumentPicker/PhotoPicker) as raw JSON numbers, not
// strings. These IDs can exceed Number.MAX_SAFE_INTEGER (9,007,199,254,740,991)
// -- JSON.parse would silently round such a value the instant it's parsed
// into a JS number, with no error and no way to detect the corruption
// afterward (it just looks like a valid, wrong ID). A JSON.parse reviver
// can't fix this either, since precision is already lost by the time a
// reviver runs. The only safe fix is intercepting the raw string before any
// number gets constructed -- quote every unquoted numeric "id" field so it
// parses as a string instead.
function quoteNumericIdFields(rawJson: string): string {
  return rawJson.replace(/"id"\s*:\s*(\d+)/g, '"id":"$1"');
}

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

  // Shared location (one-time "current location" pin -- Meta's Cloud API
  // does not appear to relay ongoing live-location updates, so this is
  // treated as a single static point regardless of how the user shared it).
  if (message.location) {
    dto.latitude = message.location.latitude;
    dto.longitude = message.location.longitude;
  }

  // Media messages: image/video/audio/document all carry the same shape
  // (id + mime_type), just under a different key matching message.type.
  const mediaObject: MetaMediaObject | undefined =
    message.image ?? message.video ?? message.audio ?? message.document;

  if (mediaObject) {
    dto.mediaId = mediaObject.id;
    dto.mediaMimeType = mediaObject.mime_type;

    if (mediaObject.sha256) {
      dto.mediaSha256 = mediaObject.sha256;
    }
  }

  // Shared contact card message.
  if (message.type === "contacts" && message.contacts) {
    dto.contacts = message.contacts;
  }

  // Button reply
  if (message.interactive?.button_reply) {
    dto.buttonReplyId = message.interactive.button_reply.id;
    dto.buttonReplyTitle = message.interactive.button_reply.title;
  }

  // List reply
  if (message.interactive?.list_reply) {
    dto.listReplyId = message.interactive.list_reply.id;
    dto.listReplyTitle = message.interactive.list_reply.title;
  }

  // Flow submission reply
  if (message.interactive?.nfm_reply?.response_json) {
      try {
          const safeJson = quoteNumericIdFields(message.interactive.nfm_reply.response_json);
          dto.flowResponse = JSON.parse(safeJson);
      } catch (error) {
          console.error("Failed to parse flow response_json:", error);
      }
  }
  
  return dto;
}