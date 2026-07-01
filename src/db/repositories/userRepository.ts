import { Pool } from "pg";
import { IncomingMessageDto } from "../../types/incomingMessageDto.js";
import { Language } from "../../constants/languages.js";

export type DbUser = {
  id: number;
  sender_id: string;
  wa_id: string | null;
  display_name: string | null;
  preferred_language: string | null;
};

function assertRow<T>(row: T | undefined, errorMessage: string): T {
  if (!row) throw new Error(errorMessage);
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

export async function updateUserLanguage(
  pool: Pool,
  userId: number,
  language: Language
): Promise<DbUser> {
  const result = await pool.query<DbUser>(
    `
    UPDATE users
    SET
      preferred_language = $2,
      updated_at = NOW()
    WHERE id = $1
    RETURNING id, sender_id, wa_id, display_name, preferred_language;
    `,
    [userId, language]
  );

  return assertRow(result.rows[0], "Failed to update user language");
}