import { cookies } from "next/headers";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

const SESSION_COOKIE = "lecolino_session";

type SessionData = {
  userId: number;
  expiresAt: number;
};

function getSecret() {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_SECRET n'est pas défini.");
  }

  return secret;
}

function sign(data: string) {
  return crypto
    .createHmac("sha256", getSecret())
    .update(data)
    .digest("hex");
}

function verifySessionToken(token: string): SessionData | null {
  const parts = token.split(".");

  if (parts.length !== 3) {
    return null;
  }

  const [userIdText, expiresAtText, signature] = parts;

  const data = `${userIdText}.${expiresAtText}`;
  const expectedSignature = sign(data);

  if (signature !== expectedSignature) {
    return null;
  }

  const userId = Number(userIdText);
  const expiresAt = Number(expiresAtText);

  if (!Number.isInteger(userId) || !Number.isFinite(expiresAt)) {
    return null;
  }

  if (expiresAt < Date.now()) {
    return null;
  }

  return {
    userId,
    expiresAt,
  };
}

export function createSessionToken(userId: number) {
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;

  const data = `${userId}.${expiresAt}`;
  const signature = sign(data);

  return `${data}.${signature}`;
}

export async function setSession(userId: number) {
  const token = createSessionToken(userId);
  const cookieStore = await cookies();

  cookieStore.set({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });
}

export async function getSessionUserId() {
  const cookieStore = await cookies();

  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  const session = verifySessionToken(token);

  return session?.userId ?? null;
}

export async function getCurrentUser() {
  const userId = await getSessionUserId();

  if (!userId) {
    return null;
  }

  return prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      nom: true,
      prenom: true,
      email: true,
      role: true,
      professeur: {
        select: {
          id: true,
          telephone: true,
          actif: true,
        },
      },
    },
  });
}

export async function requireAdmin() {
  const user = await getCurrentUser();

  if (!user) {
    return {
      authorized: false as const,
      status: 401,
      user: null,
    };
  }

  if (user.role !== "ADMIN") {
    return {
      authorized: false as const,
      status: 403,
      user,
    };
  }

  return {
    authorized: true as const,
    status: 200,
    user,
  };
}

export async function clearSession() {
  const cookieStore = await cookies();

  cookieStore.delete(SESSION_COOKIE);
}