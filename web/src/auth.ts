import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "./db";
import { users } from "./db/schema";
import { eq } from "drizzle-orm";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        
        // Simple try-catch in case DB connection is unavailable
        try {
          const userList = await db.select().from(users).where(eq(users.email, credentials.email as string)).limit(1);
          if (userList.length === 0) return null;
          
          const user = userList[0];
          
          // Verify SHA256 password hash (Dynamic import to bypass Edge Compilation)
          const crypto = await import("crypto");
          const hash = crypto.createHash('sha256').update(credentials.password as string).digest('hex');
          if (user.password !== hash) return null;
          
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          };
        } catch (error) {
          console.error("Auth authorize DB error:", error);
          // Fallback user if DB is down for testing purposes (only in development)
          if (process.env.NODE_ENV !== 'production' && credentials.email === 'admin@agentcrm.com' && credentials.password === 'admin123') {
            return {
              id: '00000000-0000-0000-0000-000000000000',
              name: 'Demo Admin',
              email: 'admin@agentcrm.com',
              role: 'ADMIN',
            };
          }
          return null;
        }
      }
    })
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  }
});
