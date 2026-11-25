
"use server";

import { CreateCompanion, GetAllCompanions } from "@/types";
import { apiFetch } from "@/lib/api";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

interface Companion {
  id: string;
  name: string;
  subject: string;
  topic: string;
  voice: string;
  style: string;
  duration: number;
  author: string;
  created_at: string;
}

interface SessionHistory {
  id: string;
  companion_id: string;
  user_id: number;
  created_at: string;
}

interface CompanionPermissions {
  plan: "free" | "pro" | "premium";
  currentCount: number;
  limit: number | null;
  remaining: number | null;
  canCreate: boolean;
}

// Create a companion
export const createCompanion = async (
  formData: CreateCompanion
) => {
  const companion = await apiFetch<Companion>(
    "/companions",
    {
      method: "POST",
      body: JSON.stringify(formData),
    }
  );

  revalidatePath("/");
  revalidatePath("/companions");
  revalidatePath("/companions/new");
  revalidatePath("/my-journey");

  return companion;
};

// Get all companions with search and filtering
export const getAllCompanions = async ({
  limit = 10,
  page = 1,
  subject,
  topic,
}: GetAllCompanions) => {
  const params = new URLSearchParams({
    limit: String(limit),
    page: String(page),
  });

  if (subject) {
    params.set(
      "subject",
      Array.isArray(subject)
        ? subject[0] ?? ""
        : subject
    );
  }

  if (topic) {
    params.set(
      "topic",
      Array.isArray(topic)
        ? topic[0] ?? ""
        : topic
    );
  }

  return apiFetch<Companion[]>(
    `/companions?${params.toString()}`,
    {},
    false
  );
};

// Get a single companion
export const getCompanion = async (id: string) => {
  return apiFetch<Companion>(
    `/companions/${encodeURIComponent(id)}`
  );
};

// Save session history
export const addToSessionHistory = async (
  companionId: string
) => {
  const result = await apiFetch<SessionHistory>(
    "/sessions",
    {
      method: "POST",
      body: JSON.stringify({ companionId }),
    }
  );

  revalidatePath("/");
  revalidatePath("/my-journey");

  return result;
};

// Get recent sessions for the authenticated user
export const getRecentSessions = async (limit = 10) => {
  const session = await auth();

  if (!session?.user?.id) {
    return [];
  }

  return apiFetch<Companion[]>(
    `/sessions/me?limit=${limit}`
  );
};

// Get authenticated user's sessions
export const getUserSessions = async (
  userId: string,
  limit = 10
) => {
  const session = await auth();

  if (!session?.user?.id || session.user.id !== userId) {
    throw new Error("Unauthorized");
  }

  return apiFetch<Companion[]>(
    `/sessions/me?limit=${limit}`
  );
};

// Get authenticated user's companions
export const getUserCompanions = async (
  userId: string
) => {
  const session = await auth();

  if (!session?.user?.id || session.user.id !== userId) {
    throw new Error("Unauthorized");
  }

  return apiFetch<Companion[]>("/companions/me");
};

// Get subscription-based companion permissions
export const getCompanionPermissions = async () => {
  return apiFetch<CompanionPermissions>(
    "/companions/permissions"
  );
};

// Check whether the user can create a companion
export const newCompanionPermissions = async () => {
  const session = await auth();

  if (!session?.user?.id) {
    return false;
  }

  const permissions = await getCompanionPermissions();

  return permissions.canCreate;
};

// Delete a companion
export const deleteCompanion = async (id: string) => {
  const result = await apiFetch<{
    message: string;
    id: string;
  }>(`/companions/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });

  revalidatePath("/");
  revalidatePath("/companions");
  revalidatePath("/companions/new");
  revalidatePath("/my-journey");

  return result;
};
