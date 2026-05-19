import { IncomingMessageDto, IncomingMessageType } from "../types/incoming-message.dto.js";
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

function parseIncomingMessage(payload: MetaWebhookPayload): IncomingMessageDto | null {
    const entry = payload.entry[0]
    if (!entry) { return null } 

    const change = entry.changes[0]
    if (!change) { return null }

    if (change.field !== "messages") { return null }

    const value = change.value
    const metadata = value.metadata
    const status = value.statuses?.[0]
    if (status) { return null }
    const contact = value.contacts?.[0]
    const message = change.value.messages?.[0]
    if (!message) { return null }

    const type = mapMessageType(message.type)

    const userWaId = message.from ?? contact?.wa_id
    if (!userWaId) { return null }

    const dto: IncomingMessageDto = {
        messageId: message.id,
        timestamp: message.timestamp,
        userWaId: userWaId,
        botPhoneNumberId: metadata.phone_number_id,
        botDisplayPhoneNumber: metadata.display_phone_number,
        type: type,
        raw: payload,
    }

    if (contact?.profile?.name) {
        dto.userName = contact.profile.name
    }

    if (message.from_user_id) {
        dto.metaUserId = message.from_user_id
    } else if (contact?.user_id) {
        dto.metaUserId = contact.user_id
    }

    if (message.text?.body !== undefined) {
        dto.text = message.text.body
    }

    return dto
}