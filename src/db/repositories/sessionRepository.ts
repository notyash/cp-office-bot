import { Pool } from "pg";
import { SESSION_STATES, SessionState } from "../../constants/sessionStates.js";
import { Intent } from "../../constants/intents.js";

const SESSION_TTL_MINUTES = 30;

export type DbSession = {
  id: number;
  user_id: number;
  state: SessionState;
  active_intent: Intent | null;

  active_step: string | null;
  draft_complaint_id: number | null;

  last_seen_at: Date;
  expires_at: Date;
  ended_at: Date | null;
  end_reason: string | null;
  created_at: Date;
  updated_at: Date;
};

function assertRow<T>(row: T | undefined, errorMessage: string): T {
  if (!row) {
    throw new Error(errorMessage);
  }

  return row;
}

const SESSION_SELECT_FIELDS = `
  id,
  user_id,
  state,
  active_intent,
  active_step,
  draft_complaint_id,
  last_seen_at,
  expires_at,
  ended_at,
  end_reason,
  created_at,
  updated_at
`;

export async function getActiveSession(
  pool: Pool,
  userId: number
): Promise<DbSession | null> {
  const result = await pool.query<DbSession>(
    `
    SELECT
      ${SESSION_SELECT_FIELDS}
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
    INSERT INTO sessions (
      user_id,
      state,
      last_seen_at,
      expires_at
    )
    VALUES (
      $1,
      $2,
      NOW(),
      NOW() + ($3 * INTERVAL '1 minute')
    )
    RETURNING
      ${SESSION_SELECT_FIELDS};
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
      expires_at = NOW() + ($2 * INTERVAL '1 minute'),
      updated_at = NOW()
    WHERE id = $1
    RETURNING
      ${SESSION_SELECT_FIELDS};
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
      expires_at = NOW() + ($4 * INTERVAL '1 minute'),
      updated_at = NOW()
    WHERE id = $1
    RETURNING
      ${SESSION_SELECT_FIELDS};
    `,
    [sessionId, state, activeIntent, SESSION_TTL_MINUTES]
  );

  return assertRow(result.rows[0], "Failed to update session state");
}

export async function updateSessionIntent(
  pool: Pool,
  sessionId: number,
  activeIntent: Intent | null
): Promise<DbSession> {
  const result = await pool.query<DbSession>(
    `
    UPDATE sessions
    SET
      active_intent = $2,
      last_seen_at = NOW(),
      expires_at = NOW() + ($3 * INTERVAL '1 minute'),
      updated_at = NOW()
    WHERE id = $1
    RETURNING
      ${SESSION_SELECT_FIELDS};
    `,
    [sessionId, activeIntent, SESSION_TTL_MINUTES]
  );

  return assertRow(result.rows[0], "Failed to update session intent");
}

export async function updateSessionProgress(
  pool: Pool,
  sessionId: number,
  activeStep: string | null,
  draftComplaintId: number | null
): Promise<DbSession> {
  const result = await pool.query<DbSession>(
    `
    UPDATE sessions
    SET
      active_step = $2,
      draft_complaint_id = $3,
      last_seen_at = NOW(),
      expires_at = NOW() + ($4 * INTERVAL '1 minute'),
      updated_at = NOW()
    WHERE id = $1
    RETURNING
      ${SESSION_SELECT_FIELDS};
    `,
    [sessionId, activeStep, draftComplaintId, SESSION_TTL_MINUTES]
  );

  return assertRow(result.rows[0], "Failed to update session progress");
}

export async function clearSessionProgress(
  pool: Pool,
  sessionId: number
): Promise<DbSession> {
  return updateSessionProgress(pool, sessionId, null, null);
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
      active_intent = NULL,
      active_step = NULL,
      draft_complaint_id = NULL,
      ended_at = NOW(),
      end_reason = $3,
      updated_at = NOW()
    WHERE id = $1
    RETURNING
      ${SESSION_SELECT_FIELDS};
    `,
    [sessionId, SESSION_STATES.ENDED, reason]
  );

  return assertRow(result.rows[0], "Failed to end session");
}