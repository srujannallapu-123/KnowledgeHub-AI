import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import PostgresAdapter from "@auth/pg-adapter";
import bcrypt from "bcryptjs";
import { pool } from "@/lib/db";
import { z } from "zod";

export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: PostgresAdapter(pool),

    session: {
        strategy: "jwt",
    },

    providers: [
        Google({
            clientId: process.env.AUTH_GOOGLE_ID!,
            clientSecret: process.env.AUTH_GOOGLE_SECRET!,
        }),

        Credentials({
            credentials: {
                email: { type: "email" },
                password: { type: "password" },
            },

            async authorize(credentials) {
                const parsed = z.object({
                    email: z.string().trim().email(),
                    password: z.string().min(8).max(72),
                }).safeParse(credentials);

                if (!parsed.success) {
                    return null;
                }

                const { email, password } = parsed.data;

                if (Buffer.byteLength(password, "utf8") > 72) {
                    return null;
                }

                const result = await pool.query(
                    `SELECT id, name, email, image, password_hash
                     FROM users
                     WHERE email = $1`,
                    [email.toLowerCase()]
                );

                const user = result.rows[0];

                if (!user || !user.password_hash) {
                    return null;
                }

                const isValid = await bcrypt.compare(
                    password,
                    user.password_hash
                );

                if (!isValid) {
                    return null;
                }

                return {
                    id: String(user.id),
                    name: user.name,
                    email: user.email,
                    image: user.image,
                };
            },
        }),
    ],

    pages: {
        signIn: "/sign-in",
    },

    callbacks: {
        async jwt({ token, user }) {
            if (user?.id) {
                token.sub = String(user.id);
            }

            return token;
        },

        async session({ session, token }) {
            if (session.user && token.sub) {
                session.user.id = token.sub;
            }

            return session;
        },
    },
});