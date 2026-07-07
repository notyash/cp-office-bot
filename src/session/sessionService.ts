import { Pool } from "pg";
import { IncomingMessageDto } from "../types/incomingMessageDto.js";
import { DbUser, getOrCreateUser } from "../db/repositories/userRepository.js";
import {
    createSession,
    DbSession,
    getActiveSession,
    touchSession,
} from "../db/repositories/sessionRepository.js";
import { SESSION_STATES } from "../constants/sessionStates.js";

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

    const activeSession = await getActiveSession(pool, user.id);

    if (activeSession) {
        const touchedSession = await touchSession(pool, activeSession.id);

        return {
            user,
            session: touchedSession,
            isNewSession: false,
        };
    }

    const initialState = user.preferred_language
        ? SESSION_STATES.READY
        : SESSION_STATES.WAITING_FOR_LANGUAGE;

    const session = await createSession(pool, user.id, initialState);

    return {
        user,
        session,
        isNewSession: true,
    };
}