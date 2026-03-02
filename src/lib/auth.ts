import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { getSQL } from "./db";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google,
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) return false;
      const sql = getSQL();

      const existing = await sql`SELECT id FROM users WHERE email = ${user.email}`;
      if (existing.length === 0) {
        await sql`
          INSERT INTO users (id, name, email, image)
          VALUES (${crypto.randomUUID()}, ${user.name}, ${user.email}, ${user.image})
        `;
      }

      const users = await sql`SELECT id FROM users WHERE email = ${user.email}`;
      if (users.length > 0 && account) {
        const userId = users[0].id as string;
        const existingAccount = await sql`
          SELECT id FROM accounts WHERE provider = ${account.provider} AND "providerAccountId" = ${account.providerAccountId}
        `;
        if (existingAccount.length === 0) {
          await sql`
            INSERT INTO accounts (id, "userId", type, provider, "providerAccountId", refresh_token, access_token, expires_at, token_type, scope, id_token)
            VALUES (${crypto.randomUUID()}, ${userId}, ${account.type}, ${account.provider}, ${account.providerAccountId}, ${account.refresh_token ?? null}, ${account.access_token ?? null}, ${account.expires_at ?? null}, ${account.token_type ?? null}, ${account.scope ?? null}, ${account.id_token ?? null})
          `;
        }
      }

      return true;
    },
    async jwt({ token }) {
      if (token.email && !token.userId) {
        const sql = getSQL();
        const users = await sql`SELECT id FROM users WHERE email = ${token.email}`;
        if (users.length > 0) {
          token.userId = users[0].id as string;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.userId) {
        (session as unknown as Record<string, unknown>).userId = token.userId;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});

export async function getRequiredUserId(): Promise<string> {
  const session = await auth();
  const userId = (session as unknown as Record<string, unknown>)?.userId as string | undefined;
  if (!userId) throw new Error("Not authenticated");
  return userId;
}
