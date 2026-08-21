function convertId(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== "object") return obj;

  if (Array.isArray(obj)) return obj.map(convertId);

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (key === "_id") {
      result.id = String(value);
    } else if (key === "__v") {
      continue;
    } else if (key === "toJSON" || key === "inspect") {
      continue;
    } else if (value instanceof Date) {
      result[key] = value.toISOString();
    } else {
      result[key] = convertId(value);
    }
  }
  return result;
}

export function serialize<T>(data: T): T {
  return convertId(data) as T;
}
