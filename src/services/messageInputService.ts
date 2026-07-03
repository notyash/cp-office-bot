import { IncomingMessageDto } from "../types/incomingMessageDto.js";

export function getIncomingMessageInput(dto: IncomingMessageDto): string | undefined {
  return dto.listReplyId ?? dto.buttonReplyId ?? dto.text;
}