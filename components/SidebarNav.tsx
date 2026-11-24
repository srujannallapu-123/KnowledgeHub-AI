"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Bot,
  ChartNoAxesColumn,
  CreditCard,
} from "lucide-react";

const navigation = [
  {
    label: "Overview",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    label: "Companions",
    href: "/companions",
    icon: Bot,
  },
  {
    label: "My Journey",
    href: "/my-journey",
    icon: ChartNoAxesColumn,
  },
  {
    label: "Subscription",
    href: "/subscription",
    icon: CreditCard,
  },
];

export default function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main navigation"
      className="flex flex-col gap-1.5 max-md:flex-row max-md:overflow-x-auto"
    >
      {navigation.map(({ label, href, icon: Icon }) => {
        const isActive =
          href === "/"
            ? pathname === "/"
            : pathname === href ||
              pathname.startsWith(`${href}/`);

        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={`sidebar-link ${
              isActive ? "sidebar-link-active" : ""
            }`}
          >
            <Icon size={19} strokeWidth={1.8} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}