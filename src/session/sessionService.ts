import { Pool } from "pg";
import { IncomingMessageDto } from "../types/incomingMessageDto.js";
import {
  createSession,
  DbSession,
  getActiveSession,
  touchSession,
} from "../db/repositories/sessionRepository.js";
import { DbUser, getOrCreateUser } from "../db/repositories/userRepository.js";

export type SessionContext = {
  user: DbUser;
  session: DbSession;
  isNewSession: boolean;
};

export async function getOrCreateSessionContext(
  pool: Pool,
  dto: IncomingMessageDto
): Promise<SessionContext> {
  const user = await getOrCreateUser(pool, dto);

  const existingSession = await getActiveSession(pool, user.id);

  if (existingSession) {
    const touchedSession = await touchSession(pool, existingSession.id);

    return {
      user,
      session: touchedSession,
      isNewSession: false,
    };
  }

  const newSession = await createSession(pool, user.id);

  return {
    user,
    session: newSession,
    isNewSession: true,
  };
}