export function parsePoliceStationReplyId(
  input: string | undefined
): number | null {
  if (!input) {
    return null;
  }

  const match = input.match(/^POLICE_STATION_(\d+)$/);

  if (!match) {
    return null;
  }

  return Number(match[1]);
}

export function normalizePhoneNumber(input: string | undefined): string | null {
  if (!input) {
    return null;
  }

  const digitsOnly = input.replace(/\D/g, "");

  if (digitsOnly.length < 10 || digitsOnly.length > 15) {
    return null;
  }

  return digitsOnly;
}

export function normalizeRequiredText(
  input: string | undefined,
  minLength = 1
): string | null {
  const value = input?.trim();

  if (!value || value.length < minLength) {
    return null;
  }

  return value;
}