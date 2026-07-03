import { Pool } from "pg";
import { IncomingMessageDto } from "../../types/incomingMessageDto.js";
import { SessionContext } from "../../session/sessionService.js";

export type ConversationHandlerContext = {
  pool: Pool;
  dto: IncomingMessageDto;
  context: SessionContext;
  input: string | undefined;
};