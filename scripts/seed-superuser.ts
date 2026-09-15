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
  const passwordHash = await hashPassword(password);

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.loginKey, SUPERUSER_LOGIN_KEY))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.loginKey, SUPERUSER_LOGIN_KEY));
    console.log("Superusuario Vectoria — contraseña sincronizada desde env.");
    await getPool().end();
    return;
  }

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
