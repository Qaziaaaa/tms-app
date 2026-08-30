import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { Student, User } from "@/models";
import { recordFailure, resetAttempts } from "@/lib/rate-limit";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string | null;
      email: string | null;
      role: string;
      mustChangePassword: boolean;
    };
  }

  interface User {
    role: string;
    mustChangePassword: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    mustChangePassword: boolean;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        identifier: { label: "Email or roll number", type: "text" },
        email: { label: "Email", type: "email" },
        portal: { label: "Portal", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        const identifier = String(credentials?.identifier ?? credentials?.email ?? "").trim();
        if (!identifier || !credentials?.password) return null;

        const ip = req?.headers?.get("x-forwarded-for")?.split(",")[0]?.trim()
          || req?.headers?.get("x-real-ip")
          || "127.0.0.1";
        const rlKey = `login:${ip}`;

        await connectDB();
        const requestedPortal = credentials?.portal === "teacher" || credentials?.portal === "student"
          ? credentials.portal
          : null;
        let user = await User.findOne({ email: identifier.toLowerCase() }).lean();

        if (!user && requestedPortal === "student") {
          const matches = await Student.find({ rollNumber: identifier.toUpperCase() }).select("userId").lean();
          if (matches.length === 1 && matches[0].userId) {
            user = await User.findById(matches[0].userId).lean();
          } else if (matches.length > 1 && matches[0].userId) {
            user = await User.findById(matches[0].userId).lean();
          }
        }

        if (!user || (requestedPortal && user.role !== requestedPortal)) {
          recordFailure(rlKey);
          return null;
        }

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!isValid) {
          recordFailure(rlKey);
          return null;
        }

        resetAttempts(rlKey);

        return {
          id: String(user._id),
          name: user.name,
          email: user.email,
          role: user.role,
          mustChangePassword: user.mustChangePassword ?? false,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.role = (user as { role: string }).role;
        token.mustChangePassword = (user as { mustChangePassword?: boolean }).mustChangePassword ?? false;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.mustChangePassword = Boolean(token.mustChangePassword);
      }
      return session;
    },
  },
  pages: { signIn: "/login" },
});
