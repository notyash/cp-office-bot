import { Pool } from "pg";

export type DbPoliceStation = {
  id: number;
  name: string;
  code: string | null;
  jurisdiction_area: string | null;
  address: string | null;
  city: string | null;
  district: string | null;
  state: string;
  pincode: string | null;
  latitude: string | null;
  longitude: string | null;
  phone_number: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
};

export async function getActivePoliceStations(
  pool: Pool
): Promise<DbPoliceStation[]> {
  const result = await pool.query<DbPoliceStation>(
    `
    SELECT
      id,
      name,
      code,
      jurisdiction_area,
      address,
      city,
      district,
      state,
      pincode,
      latitude,
      longitude,
      phone_number,
      is_active,
      created_at,
      updated_at
    FROM police_stations
    WHERE is_active = TRUE
    ORDER BY name ASC
    `
  );

  return result.rows;
}

export async function getPoliceStationById(
  pool: Pool,
  policeStationId: number
): Promise<DbPoliceStation | null> {
  const result = await pool.query<DbPoliceStation>(
    `
    SELECT
      id,
      name,
      code,
      jurisdiction_area,
      address,
      city,
      district,
      state,
      pincode,
      latitude,
      longitude,
      phone_number,
      is_active,
      created_at,
      updated_at
    FROM police_stations
    WHERE id = $1
      AND is_active = TRUE
    LIMIT 1
    `,
    [policeStationId]
  );

  return result.rows[0] ?? null;
}

export async function getPoliceStationByCode(
    pool: Pool,
    code: string
): Promise<DbPoliceStation | null> {
    const result = await pool.query<DbPoliceStation>(
        `
        SELECT
            id,
            name,
            code,
            jurisdiction_area,
            address,
            city,
            district,
            state,
            pincode,
            latitude,
            longitude,
            phone_number,
            is_active,
            created_at,
            updated_at
        FROM police_stations
        WHERE code = $1
            AND is_active = TRUE
        LIMIT 1
        `,
        [code]
    );

    return result.rows[0] ?? null;
}