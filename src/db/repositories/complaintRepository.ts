import { Pool } from "pg";
import {
  COMPLAINT_STATUSES,
  ComplaintStatus,
} from "../../constants/complaints.js";

export type DbComplaint = {
  id: number;
  complaint_number: string | null;

  user_id: number;
  police_station_id: number | null;

  status: ComplaintStatus;

  category: string | null;

  complainant_full_name: string | null;
  complainant_phone: string | null;

  id_proof_type: string | null;
  id_proof_number: string | null;

  description: string | null;

  submitted_at: Date | null;

  created_at: Date;
  updated_at: Date;
};

function assertComplaint(row: DbComplaint | undefined): DbComplaint {
  if (!row) {
    throw new Error("Expected complaint row but got none");
  }

  return row;
}

export async function createDraftComplaint(
  pool: Pool,
  userId: number
): Promise<DbComplaint> {
  const result = await pool.query<DbComplaint>(
    `
    INSERT INTO complaints (
      user_id,
      status
    )
    VALUES ($1, $2)
    RETURNING
      id,
      complaint_number,
      user_id,
      police_station_id,
      status,
      category,
      complainant_full_name,
      complainant_phone,
      id_proof_type,
      id_proof_number,
      description,
      submitted_at,
      created_at,
      updated_at
    `,
    [userId, COMPLAINT_STATUSES.DRAFT]
  );

  return assertComplaint(result.rows[0]);
}

export async function getComplaintByIdForUser(
  pool: Pool,
  complaintId: number,
  userId: number
): Promise<DbComplaint | null> {
  const result = await pool.query<DbComplaint>(
    `
    SELECT
      id,
      complaint_number,
      user_id,
      police_station_id,
      status,
      category,
      complainant_full_name,
      complainant_phone,
      id_proof_type,
      id_proof_number,
      description,
      submitted_at,
      created_at,
      updated_at
    FROM complaints
    WHERE id = $1
      AND user_id = $2
    LIMIT 1
    `,
    [complaintId, userId]
  );

  return result.rows[0] ?? null;
}

export async function updateComplaintPoliceStation(
  pool: Pool,
  complaintId: number,
  policeStationId: number
): Promise<DbComplaint> {
  const result = await pool.query<DbComplaint>(
    `
    UPDATE complaints
    SET
      police_station_id = $1,
      updated_at = NOW()
    WHERE id = $2
      AND status = $3
    RETURNING
      id,
      complaint_number,
      user_id,
      police_station_id,
      status,
      category,
      complainant_full_name,
      complainant_phone,
      id_proof_type,
      id_proof_number,
      description,
      submitted_at,
      created_at,
      updated_at
    `,
    [policeStationId, complaintId, COMPLAINT_STATUSES.DRAFT]
  );

  return assertComplaint(result.rows[0]);
}

export async function getSubmittedComplaintsForUser(
  pool: Pool,
  userId: number
): Promise<DbComplaint[]> {
  const result = await pool.query<DbComplaint>(
    `
    SELECT
      id,
      complaint_number,
      user_id,
      police_station_id,
      status,
      category,
      complainant_full_name,
      complainant_phone,
      id_proof_type,
      id_proof_number,
      description,
      submitted_at,
      created_at,
      updated_at
    FROM complaints
    WHERE user_id = $1
      AND status != $2
    ORDER BY created_at DESC
    `,
    [userId, COMPLAINT_STATUSES.DRAFT]
  );

  return result.rows;
}

export async function updateComplaintFullName(
  pool: Pool,
  complaintId: number,
  fullName: string
): Promise<DbComplaint> {
  const result = await pool.query<DbComplaint>(
    `
    UPDATE complaints
    SET
      complainant_full_name = $1,
      updated_at = NOW()
    WHERE id = $2
      AND status = $3
    RETURNING
      id,
      complaint_number,
      user_id,
      police_station_id,
      status,
      category,
      complainant_full_name,
      complainant_phone,
      id_proof_type,
      id_proof_number,
      description,
      submitted_at,
      created_at,
      updated_at
    `,
    [fullName, complaintId, COMPLAINT_STATUSES.DRAFT]
  );

  return assertComplaint(result.rows[0]);
}

export async function updateComplaintPhone(
  pool: Pool,
  complaintId: number,
  phone: string
): Promise<DbComplaint> {
  const result = await pool.query<DbComplaint>(
    `
    UPDATE complaints
    SET
      complainant_phone = $1,
      updated_at = NOW()
    WHERE id = $2
      AND status = $3
    RETURNING
      id,
      complaint_number,
      user_id,
      police_station_id,
      status,
      category,
      complainant_full_name,
      complainant_phone,
      id_proof_type,
      id_proof_number,
      description,
      submitted_at,
      created_at,
      updated_at
    `,
    [phone, complaintId, COMPLAINT_STATUSES.DRAFT]
  );

  return assertComplaint(result.rows[0]);
}