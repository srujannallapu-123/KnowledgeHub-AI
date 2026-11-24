"use server";

import { pool } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";

const registerSchema = z.object({
    name: z.string().trim().min(2).max(100),
    email: z.string().trim().email().max(254),
    password: z.string().min(8).max(72),
});

export async function registerUser(formData: FormData) {
    const parsed = registerSchema.safeParse({
        name: formData.get("name"),
        email: formData.get("email"),
        password: formData.get("password"),
    });

    if (!parsed.success) {
        return {
            success: false,
            message: "Please enter valid registration details.",
        };
    }

    const { name, email, password } = parsed.data;

    if (Buffer.byteLength(password, "utf8") > 72) {
        return {
            success: false,
            message: "Password is too long.",
        };
    }

    try {
        const passwordHash = await bcrypt.hash(password, 12);

        const result = await pool.query(
            `INSERT INTO users (name, email, password_hash)
             VALUES ($1, $2, $3)
             ON CONFLICT (email) DO NOTHING
             RETURNING id`,
            [name, email.toLowerCase(), passwordHash]
        );

        if (result.rowCount === 0) {
            return {
                success: false,
                message: "Unable to register. Try signing in instead.",
            };
        }

        return {
            success: true,
            message: "Account created successfully.",
        };

    } catch (error) {
        console.error("Registration failed:", error);

        return {
            success: false,
            message: "Registration failed. Please try again.",
        };
    }
}