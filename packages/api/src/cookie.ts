const encoder = new TextEncoder();

function bytesToHex(bytes: Uint8Array): string {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function signature(value: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return bytesToHex(new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(value))));
}

export async function signedActor(cookieHeader: string | undefined, secret: string): Promise<{
  actorId: string;
  cookie?: string;
}> {
  const cookieValue = cookieHeader
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("lunacea_actor="))
    ?.slice("lunacea_actor=".length);
  if (cookieValue) {
    const [actorId, supplied] = cookieValue.split(".");
    if (actorId && supplied && supplied === await signature(actorId, secret)) return { actorId };
  }
  const actorId = crypto.randomUUID();
  const value = `${actorId}.${await signature(actorId, secret)}`;
  return {
    actorId,
    cookie: `lunacea_actor=${value}; Path=/; Max-Age=31536000; HttpOnly; Secure; SameSite=Lax`,
  };
}
