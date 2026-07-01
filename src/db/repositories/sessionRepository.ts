import { Pool } from "pg";
import { IncomingMessageDto } from "../../types/incomingMessageDto.js";
import { SESSION_STATES, SessionState } from "../../constants/sessionStates.js";
import { Intent } from "../../constants/intents.js";

const SESSION_TTL_MINUTES = 30;

export type DbUser = {
  id: number;
  sender_id: string;
  wa_id: string | null;
  display_name: string | null;
  preferred_language: string | null;
};

export type DbSession = {
  id: number;
  user_id: number;
  state: SessionState;
  active_intent: Intent | null;
  last_seen_at: Date;
  expires_at: Date;
  ended_at: Date | null;
  end_reason: string | null;
};

function assertRow<T>(row: T | undefined, errorMessage: string): T {
  if (!row) {
    throw new Error(errorMessage);
  }

  return row;
}

export async function getOrCreateUser(
  pool: Pool,
  dto: IncomingMessageDto
): Promise<DbUser> {
  const result = await pool.query<DbUser>(
    `
    INSERT INTO users (sender_id, wa_id, display_name)
    VALUES ($1, $2, $3)
    ON CONFLICT (sender_id)
    DO UPDATE SET
      wa_id = COALESCE(users.wa_id, EXCLUDED.wa_id),
      display_name = COALESCE(EXCLUDED.display_name, users.display_name),
      updated_at = NOW()
    RETURNING id, sender_id, wa_id, display_name, preferred_language;
    `,
    [dto.senderId, dto.senderWaId ?? null, dto.userName ?? null]
  );

  return assertRow(result.rows[0], "Failed to create or retrieve user");
}

export async function getActiveSession(
  pool: Pool,
  userId: number
): Promise<DbSession | null> {
  const result = await pool.query<DbSession>(
    `
    SELECT id, user_id, state, active_intent, last_seen_at, expires_at, ended_at, end_reason
    FROM sessions
    WHERE user_id = $1
      AND ended_at IS NULL
      AND expires_at > NOW()
    ORDER BY created_at DESC
    LIMIT 1;
    `,
    [userId]
  );

  return result.rows[0] ?? null;
}

export async function createSession(
  pool: Pool,
  userId: number,
  state: SessionState = SESSION_STATES.WAITING_FOR_LANGUAGE
): Promise<DbSession> {
  const result = await pool.query<DbSession>(
    `
    INSERT INTO sessions (user_id, state, last_seen_at, expires_at)
    VALUES ($1, $2, NOW(), NOW() + ($3 || ' minutes')::INTERVAL)
    RETURNING id, user_id, state, active_intent, last_seen_at, expires_at, ended_at, end_reason;
    `,
    [userId, state, SESSION_TTL_MINUTES]
  );

  return assertRow(result.rows[0], "Failed to create session");
}

export async function touchSession(
  pool: Pool,
  sessionId: number
): Promise<DbSession> {
  const result = await pool.query<DbSession>(
    `
    UPDATE sessions
    SET
      last_seen_at = NOW(),
      expires_at = NOW() + ($2 || ' minutes')::INTERVAL,
      updated_at = NOW()
    WHERE id = $1
    RETURNING id, user_id, state, active_intent, last_seen_at, expires_at, ended_at, end_reason;
    `,
    [sessionId, SESSION_TTL_MINUTES]
  );

  return assertRow(result.rows[0], "Failed to touch session");
}

export async function updateSessionState(
  pool: Pool,
  sessionId: number,
  state: SessionState,
  activeIntent: Intent | null = null
): Promise<DbSession> {
  const result = await pool.query<DbSession>(
    `
    UPDATE sessions
    SET
      state = $2,
      active_intent = $3,
      last_seen_at = NOW(),
      expires_at = NOW() + ($4 || ' minutes')::INTERVAL,
      updated_at = NOW()
    WHERE id = $1
    RETURNING id, user_id, state, active_intent, last_seen_at, expires_at, ended_at, end_reason;
    `,
    [sessionId, state, activeIntent, SESSION_TTL_MINUTES]
  );

  return assertRow(result.rows[0], "Failed to update session state");
}

export async function endSession(
  pool: Pool,
  sessionId: number,
  reason: string
): Promise<DbSession> {
  const result = await pool.query<DbSession>(
    `
    UPDATE sessions
    SET
      state = $2,
      ended_at = NOW(),
      end_reason = $3,
      updated_at = NOW()
    WHERE id = $1
    RETURNING id, user_id, state, active_intent, last_seen_at, expires_at, ended_at, end_reason;
    `,
    [sessionId, SESSION_STATES.ENDED, reason]
  );

  return assertRow(result.rows[0], "Failed to end session");
}