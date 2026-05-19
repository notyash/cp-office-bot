import "dotenv/config";


function required(key: string): string {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Missing required env variable: ${key}`);
  }

  return value;
};

export const env = {
  port: Number(process.env.PORT ?? 3000),
  metaVerifyToken: required("VERIFY_TOKEN"),
  databaseUrl: required("DATABASE_URL"),
};