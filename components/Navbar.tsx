import Link from "next/link";
import { auth, signOut } from "@/auth";
import SidebarNav from "./SidebarNav";
import {
  BrainCircuit,
  Sparkles,
  LogOut,
} from "lucide-react";

const Navbar = async () => {
  const session = await auth();
  const user = session?.user;

  return (
    <aside className="dashboard-sidebar">

      {/* Brand */}
      <Link
        href="/"
        className="mb-10 flex items-center gap-3 px-2 max-md:mb-4"
      >
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#D94320] text-white">
          <BrainCircuit size={24} />
        </div>

        <div>
          <p className="text-base font-extrabold tracking-tight">
            KnowledgeHub
            <span className="text-[#D94320]"> AI</span>
          </p>

          <p className="text-[11px] font-medium text-slate-500">
            Your personal AI tutor
          </p>
        </div>
      </Link>

      {/* Navigation */}
      <p className="sidebar-label max-md:hidden">
        WORKSPACE
      </p>

      <SidebarNav />

      {/* Subscription Promotion */}
      <div className="mt-auto max-md:hidden">
        <div className="mb-5 rounded-2xl border border-orange-100 bg-orange-50 p-4">

          <Sparkles
            size={22}
            className="mb-3 text-[#D94320]"
          />

          <h3 className="text-sm font-bold">
            Unlock your potential
          </h3>

          <p className="my-3 text-xs leading-relaxed text-slate-600">
            Access more AI companions and personalise your
            learning experience.
          </p>

          <Link
            href="/subscription"
            className="btn-primary w-full"
          >
            Explore plans
          </Link>

        </div>
      </div>

      {/* Authentication */}
      <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 max-md:mt-3 max-md:flex-row max-md:items-center max-md:pt-3">

        {!user ? (
          <>
            <Link
              href="/sign-in"
              className="btn-signin w-full"
            >
              Sign In
            </Link>

            <Link
              href="/sign-up"
              className="btn-primary w-full"
            >
              Get Started
            </Link>
          </>
        ) : (
          <>
            <Link
              href="/my-journey"
              className="flex min-w-0 items-center gap-3"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-orange-100 font-bold text-[#D94320]">
                {user.name?.charAt(0).toUpperCase() ||
                  user.email?.charAt(0).toUpperCase() ||
                  "U"}
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-bold">
                  {user.name || "Learner"}
                </p>

                <p className="truncate text-xs text-slate-500">
                  {user.email}
                </p>
              </div>
            </Link>

            <form
              action={async () => {
                "use server";
                await signOut({
                  redirectTo: "/sign-in",
                });
              }}
              className="max-md:ml-auto"
            >
              <button
                type="submit"
                className="btn-signin w-full whitespace-nowrap"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </form>
          </>
        )}

      </div>
    </aside>
  );
};

export default Navbar;