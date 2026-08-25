export const TEST_DB_NAME = "tms_test";

export function getTestDbUri(): string {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI must be set for tests (check .env)");
  }

  let parsed: URL;
  try {
    parsed = new URL(uri);
  } catch {
    throw new Error(`MONGODB_URI is not a valid connection string: ${uri.replace(/\/\/[^@]*@/, "//<credentials>@")}`);
  }

  if (!parsed.protocol.startsWith("mongodb")) {
    throw new Error("MONGODB_URI must use the mongodb:// or mongodb+srv:// protocol");
  }

  parsed.pathname = `/${TEST_DB_NAME}`;
  return parsed.toString();
}

export function assertTestDbUri(uri: string): void {
  const pathname = new URL(uri).pathname;
  if (!pathname.includes(TEST_DB_NAME)) {
    throw new Error(
      `SAFETY GUARD: refusing to wipe database "${pathname}". Tests may only run against "${TEST_DB_NAME}".`
    );
  }
}
