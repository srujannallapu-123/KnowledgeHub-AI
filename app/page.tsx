import Link from "next/link";
import { auth } from "@/auth";

import CompanionCard from "@/components/CompanionCard";
import CompanionsList from "@/components/CompanionsList";
import CTA from "@/components/CTA";

import {
  getAllCompanions,
  getRecentSessions,
} from "@/lib/actions/companion.actions";

import { getSubjectColor } from "@/lib/utils";

import {
  Plus,
  ArrowUpRight,
  Sparkles,
  Bot,
  Headphones,
  BookOpen,
  Clock3,
} from "lucide-react";

const Page = async () => {
  const [companions, recentSessions, session] =
    await Promise.all([
      getAllCompanions({ limit: 3 }),
      getRecentSessions(10),
      auth(),
    ]);

  const firstName =
    session?.user?.name?.split(" ")[0] || "Learner";

  return (
    <main>

      {/* Welcome Section */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-2 text-sm font-medium text-slate-500">
            Your learning workspace
          </p>

          <h1 className="text-3xl font-extrabold text-slate-900">
            Welcome back, {firstName}!
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Discover, learn and grow with your personal AI tutors.
          </p>
        </div>

        <Link
          href="/companions/new"
          className="btn-primary"
        >
          <Plus size={19} />
          New Companion
        </Link>
      </header>

      {/* Hero Banner */}
      <section className="relative isolate overflow-hidden rounded-3xl bg-[#19192e] px-8 py-10 text-white max-md:px-6">

        {/* Decorative Background */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-32 -z-10 size-96 rounded-full bg-purple-500/20 blur-3xl"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 right-32 -z-10 size-72 rounded-full bg-orange-500/10 blur-3xl"
        />

        <div className="flex items-center justify-between gap-8">

          <div className="max-w-xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold text-orange-300">
              <Sparkles size={15} />
              AI-powered learning
            </div>

            <h2 className="text-5xl font-extrabold leading-tight tracking-tight max-md:text-3xl">
              Learn smarter.
              <span className="block text-[#FF9875]">
                Grow faster.
              </span>
            </h2>

            <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-300">
              Transform the way you learn with personalised
              AI companions, real-time voice conversations
              and interactive lessons designed around you.
            </p>

            <Link
              href="/companions"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-900 transition-colors hover:bg-orange-100"
            >
              Explore Companions
              <ArrowUpRight size={17} />
            </Link>
          </div>

          {/* Hero Illustration */}
          <div className="relative flex size-52 shrink-0 items-center justify-center max-lg:hidden">

            <div className="absolute inset-0 rounded-full border border-white/10" />

            <div className="absolute inset-5 rounded-full border border-dashed border-white/20" />

            <div className="flex size-32 items-center justify-center rounded-3xl border border-white/20 bg-white/10 shadow-2xl backdrop-blur-sm">
              <Bot
                size={75}
                strokeWidth={1.3}
                className="text-orange-300"
              />
            </div>

            <div className="absolute right-0 top-3 rounded-xl border border-white/10 bg-[#35304c] p-3">
              <Headphones size={23} />
            </div>

            <div className="absolute bottom-0 left-0 rounded-xl border border-white/10 bg-[#35304c] p-3">
              <BookOpen size={23} />
            </div>

            <div className="absolute -right-2 bottom-5 rounded-xl border border-white/10 bg-[#35304c] p-3">
              <Sparkles
                size={23}
                className="text-orange-300"
              />
            </div>

          </div>
        </div>
      </section>

      {/* Companion Section */}
      <section className="flex flex-col gap-5">

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Discover Companions
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Find your next AI-powered learning experience.
            </p>
          </div>

          <Link
            href="/companions"
            className="flex items-center gap-2 text-sm font-semibold text-[#D94320] hover:underline"
          >
            View all companions
            <ArrowUpRight size={16} />
          </Link>
        </div>

        {companions.length > 0 ? (
          <div className="companions-grid">
            {companions.map((companion) => (
              <CompanionCard
                key={companion.id}
                {...companion}
                color={getSubjectColor(companion.subject)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">

            <div className="flex size-16 items-center justify-center rounded-2xl bg-orange-50 text-[#D94320]">
              <Bot size={34} strokeWidth={1.6} />
            </div>

            <h3 className="text-lg font-bold text-slate-900">
              Your learning adventure starts here
            </h3>

            <p className="max-w-md text-sm leading-relaxed text-slate-500">
              Create your first AI companion and start
              exploring your favourite subjects through
              interactive voice lessons.
            </p>

            <Link
              href="/companions/new"
              className="btn-primary"
            >
              <Plus size={18} />
              Create Your First Companion
            </Link>

          </div>
        )}

      </section>

      {/* Learning Activity */}
      <section className="flex flex-col gap-5">

        <div>
          <div className="flex items-center gap-2">
            <Clock3
              size={23}
              className="text-[#D94320]"
            />

            <h2 className="text-2xl font-bold text-slate-900">
              Learning Activity
            </h2>
          </div>

          <p className="mt-1 text-sm text-slate-500">
            Explore recent learning sessions and
            continue your learning journey.
          </p>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-5 xl:grid-cols-[2fr_1fr]">

          <CompanionsList
            title="Recent Learning Sessions"
            companions={recentSessions}
            classNames="w-full"
          />

          <CTA />

        </div>

      </section>

      {/* Footer */}
      <footer className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 py-5 text-xs text-slate-500">
        <p>
          © {new Date().getFullYear()} KnowledgeHub AI
        </p>

        <p>Learn without boundaries.</p>
      </footer>

    </main>
  );
};

export default Page;