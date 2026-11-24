"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

type Props = {
  label: string;
  disabled?: boolean;
  primary?: boolean;
};

export default function SubscriptionButton({
  label,
  disabled = false,
  primary = false,
}: Props) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className={`flex w-full items-center
        justify-center gap-2 rounded-xl px-5 py-3
        text-sm font-semibold transition-all
        disabled:cursor-not-allowed
        disabled:opacity-50
        ${
          primary
            ? "bg-[#d94320] text-white hover:bg-[#bc3517]"
            : "border border-gray-200 bg-white text-gray-900 hover:bg-gray-50"
        }`}
    >
      {pending && (
        <Loader2 className="h-4 w-4 animate-spin" />
      )}

      {pending ? "Please wait..." : label}
    </button>
  );
}