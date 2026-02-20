import { createClient, type Client } from "@libsql/client";
import { configApp } from "../config/config";

// Use remote Turso/libsql only (no local SQLite fallback)
const tursoUrl = configApp.turso.TURSO_DATABASE_URL;
const tursoAuthToken = configApp.turso.TURSO_AUTH_TOKEN;

const createTursoClient = (): Client => {
  if (!tursoUrl) {
    return {
      execute: async () => {
        throw new Error("TURSO_DATABASE_URL is not configured");
      },
    } as unknown as Client;
  }

  return createClient({
    url: tursoUrl,
    authToken: tursoAuthToken,
  });
};

export const client = createTursoClient();
