"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { registerUser } from "@/lib/actions/auth.actions";

export default function SignUpPage() {
    const router = useRouter();

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(
        event: React.FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        setError("");
        setLoading(true);

        const formData = new FormData(event.currentTarget);

        try {
            const result = await registerUser(formData);

            if (!result.success) {
                setError(result.message);
                return;
            }

            router.push("/sign-in");

        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="flex min-h-screen items-center justify-center px-4">
            <div className="w-full max-w-md rounded-2xl border p-8 shadow-lg">

                <h1 className="mb-2 text-center text-3xl font-bold">
                    Create your account
                </h1>

                <p className="mb-6 text-center text-gray-500">
                    Join KnowledgeHub-AI
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">

                    <input
                        name="name"
                        type="text"
                        placeholder="Full name"
                        autoComplete="name"
                        required
                        className="w-full rounded-lg border p-3"
                    />

                    <input
                        name="email"
                        type="email"
                        placeholder="Email address"
                        autoComplete="email"
                        required
                        className="w-full rounded-lg border p-3"
                    />

                    <input
                        name="password"
                        type="password"
                        placeholder="Password"
                        autoComplete="new-password"
                        minLength={8}
                        maxLength={72}
                        required
                        className="w-full rounded-lg border p-3"
                    />

                    {error && (
                        <p role="alert" className="text-sm text-red-600">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-lg bg-[#EB7410] p-3 font-semibold text-white disabled:opacity-50"
                    >
                        {loading ? "Creating account..." : "Sign up"}
                    </button>

                </form>

                <p className="mt-6 text-center text-sm">
                    Already have an account?{" "}
                    <Link
                        href="/sign-in"
                        className="font-semibold text-[#EB7410]"
                    >
                        Sign in
                    </Link>
                </p>

            </div>
        </main>
    );
}