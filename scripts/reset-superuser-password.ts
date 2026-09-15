import { eq } from "drizzle-orm";
import { getDb, getPool } from "../src/server/db/client";
import { users } from "../src/server/db/schema";
import { hashPassword, verifyPassword } from "../src/server/services/password";

const SUPERUSER_LOGIN_KEY = "vectoria";

async function main() {
  const password = process.env.INTERACTIVA_SUPERUSER_PASSWORD;
  if (!password) {
    throw new Error("INTERACTIVA_SUPERUSER_PASSWORD is required.");
  }

  const db = getDb();
  const passwordHash = await hashPassword(password);

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.loginKey, SUPERUSER_LOGIN_KEY))
    .limit(1);

  if (!user) {
    await db.insert(users).values({
      loginKey: SUPERUSER_LOGIN_KEY,
      whatsapp: null,
      passwordHash,
      role: "superuser",
    });
    console.log("Superusuario creado.");
  } else {
    await db
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, user.id));
    console.log("Contraseña actualizada.");
  }

  const [check] = await db
    .select()
    .from(users)
    .where(eq(users.loginKey, SUPERUSER_LOGIN_KEY))
    .limit(1);

  const ok = check ? await verifyPassword(password, check.passwordHash) : false;
  console.log("Verificación:", ok ? "OK" : "FALLÓ");
  await getPool().end();
  process.exit(ok ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
