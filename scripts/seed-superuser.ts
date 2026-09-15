import { eq } from "drizzle-orm";
import { getDb, getPool } from "../src/server/db/client";
import { users } from "../src/server/db/schema";
import { hashPassword } from "../src/server/services/password";

const SUPERUSER_LOGIN_KEY = "vectoria";

async function main() {
  const password = process.env.INTERACTIVA_SUPERUSER_PASSWORD;
  if (!password) {
    throw new Error("INTERACTIVA_SUPERUSER_PASSWORD is required for seeding.");
  }

  const db = getDb();
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.loginKey, SUPERUSER_LOGIN_KEY))
    .limit(1);

  if (existing.length > 0) {
    console.log("Superusuario ya existe, omitiendo seed.");
    await getPool().end();
    return;
  }

  const passwordHash = await hashPassword(password);
  await db.insert(users).values({
    loginKey: SUPERUSER_LOGIN_KEY,
    whatsapp: null,
    passwordHash,
    role: "superuser",
  });

  console.log("Superusuario Vectoria creado.");
  await getPool().end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
