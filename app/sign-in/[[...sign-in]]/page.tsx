"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignInPage() {
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
            const result = await signIn("credentials", {
                email: formData.get("email"),
                password: formData.get("password"),
                redirect: false,
            });

            if (!result || result.error || !result.ok) {
                setError("Invalid email or password.");
                return;
            }

            router.push("/");
            router.refresh();

        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    async function handleGoogleSignIn() {
        setError("");
        setLoading(true);

        try {
            await signIn("google", {
                redirectTo: "/",
            });
        } catch {
            setError("Google sign-in failed. Please try again.");
            setLoading(false);
        }
    }

    return (
        <main className="flex min-h-screen items-center justify-center px-4">
            <div className="w-full max-w-md rounded-2xl border p-8 shadow-lg">

                <h1 className="mb-2 text-center text-3xl font-bold">
                    Welcome back
                </h1>

                <p className="mb-6 text-center text-gray-500">
                    Sign in to KnowledgeHub-AI
                </p>

                <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    className="w-full rounded-lg border p-3 font-semibold hover:bg-gray-100 disabled:opacity-50"
                >
                    Continue with Google
                </button>

                <div className="my-6 flex items-center gap-3">
                    <div className="h-px flex-1 bg-gray-300" />
                    <span className="text-sm text-gray-500">
                        OR
                    </span>
                    <div className="h-px flex-1 bg-gray-300" />
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">

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
                        autoComplete="current-password"
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
                        {loading ? "Signing in..." : "Sign in"}
                    </button>

                </form>

                <p className="mt-6 text-center text-sm">
                    Don't have an account?{" "}
                    <Link
                        href="/sign-up"
                        className="font-semibold text-[#EB7410]"
                    >
                        Sign up
                    </Link>
                </p>

            </div>
        </main>
    );
}