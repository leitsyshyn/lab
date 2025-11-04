import { like } from "drizzle-orm";
import { db } from "@/db/drizzle";
import { user, verification } from "@/db/schema/auth";

async function globalTeardown() {
  try {
    await db
      .delete(verification)
      .where(like(verification.identifier, "test-%"));
    await db.delete(user).where(like(user.email, "test-%"));
  } catch (error) {
    console.error("Cleanup error:", error);
  }
}

export default globalTeardown;
