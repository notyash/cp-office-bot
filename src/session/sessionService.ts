import { Pool } from "pg";
import { IncomingMessageDto } from "../types/incomingMessageDto.js";
import { DbUser, getOrCreateUser } from "../db/repositories/userRepository.js";
import {
    createSession,
    DbSession,
    endSession,
    getActiveSession,
    touchSession,
} from "../db/repositories/sessionRepository.js";
import { SESSION_STATES } from "../constants/sessionStates.js";
import { cancelComplaint } from "../services/complaintService.js";

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
        // Expiry must be checked *before* touchSession -- touchSession resets
        // expires_at on every message, so checking after it would silently
        // revive a session that had already expired.
        if (activeSession.expires_at.getTime() <= Date.now()) {
            await handleExpiredSession(pool, activeSession);

            return createFreshSessionContext(pool, user);
        }

        const touchedSession = await touchSession(pool, activeSession.id);

        return {
            user,
            session: touchedSession,
            isNewSession: false,
        };
    }

    return createFreshSessionContext(pool, user);
}

// Cancels any in-progress draft on the expired session, then formally ends
// the session with reason "EXPIRED". Caller is responsible for creating the
// replacement session afterward -- kept separate so that path is identical
// to (and shares code with) the plain no-active-session case.
async function handleExpiredSession(
    pool: Pool,
    expiredSession: DbSession
): Promise<void> {
    if (expiredSession.draft_complaint_id) {
        const result = await cancelComplaint(
            pool,
            expiredSession.draft_complaint_id
        );

        if (!result.success) {
            // Already finalized/cancelled by some other path -- not an
            // error, just worth a log line since it's an unusual race.
            console.log(
                "Draft complaint on expired session was already finalized:",
                expiredSession.draft_complaint_id
            );
        }
    }

    await endSession(pool, expiredSession.id, "EXPIRED");

    console.log(
        "Session expired and was replaced with a new one for user:",
        expiredSession.user_id
    );
}

async function createFreshSessionContext(
    pool: Pool,
    user: DbUser
): Promise<SessionContext> {
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