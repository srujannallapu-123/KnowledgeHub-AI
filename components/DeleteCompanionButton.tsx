"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteCompanion } from "@/lib/actions/companion.actions";

interface DeleteCompanionButtonProps {
  companionId: string;
  companionName: string;
}

export default function DeleteCompanionButton({
  companionId,
  companionName,
}: DeleteCompanionButtonProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    if (loading) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${companionName}"? Its session history will also be deleted. This action cannot be undone.`
    );

    if (!confirmed) return;

    setLoading(true);
    setError("");

    try {
      await deleteCompanion(companionId);

      router.refresh();
    } catch {
      setError("Failed to delete companion. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={handleDelete}
        disabled={loading}
        className="rounded-lg border border-red-500 px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50 disabled:opacity-50"
      >
        {loading ? "Deleting..." : "Delete"}
      </button>

      {error && (
        <p role="alert" className="text-xs text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}