function isPlainObject(obj: object): boolean {
  const proto = Object.getPrototypeOf(obj);
  return proto === Object.prototype || proto === null;
}

function convertId(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== "object") return obj;

  if (Array.isArray(obj)) return obj.map(convertId);

  if (obj instanceof Date) {
    return obj.toISOString();
  }

  const documentLike = obj as { toJSON?: () => unknown };
  if (typeof documentLike.toJSON === "function") {
    return convertId(documentLike.toJSON.call(obj));
  }

  if (!isPlainObject(obj as object)) {
    if (typeof (obj as { toString?: () => string }).toString === "function") {
      const str = (obj as { toString: () => string }).toString();
      if (/^[0-9a-f]{24}$/i.test(str)) return str;
    }
    return obj;
  }

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
