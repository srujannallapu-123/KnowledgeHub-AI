import Link from "next/link";
import {
  Clock3,
  ArrowUpRight,
  Headphones,
  GraduationCap,
} from "lucide-react";

interface CompanionCardProps {
  id: string;
  name: string;
  topic: string;
  subject: string;
  duration: number;
  color: string;
}

const CompanionCard = ({
  id,
  name,
  topic,
  subject,
  duration,
  color,
}: CompanionCardProps) => {
  return (
    <article className="companion-card">

      {/* Subject Icon and Badge */}
      <div className="flex items-center justify-between">
        <div
          className="flex size-14 items-center justify-center rounded-2xl"
          style={{ backgroundColor: color }}
        >
          <GraduationCap
            size={28}
            className="text-slate-800"
            strokeWidth={1.8}
          />
        </div>

        <span className="subject-badge">
          {subject}
        </span>
      </div>

      {/* Companion Information */}
      <div className="flex flex-1 flex-col gap-2">
        <h2 className="break-words text-xl font-bold text-slate-900">
          {name}
        </h2>

        <p className="break-words text-sm leading-relaxed text-slate-500">
          {topic}
        </p>
      </div>

      {/* Session Details */}
      <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500">

        <div className="flex items-center gap-1.5">
          <Clock3 size={15} />
          {duration} mins
        </div>

        <div className="flex items-center gap-1.5">
          <Headphones size={15} />
          AI Voice Tutor
        </div>

      </div>

      {/* Launch Lesson */}
      <div className="border-t border-slate-100 pt-4">
        <Link
          href={`/companions/${id}`}
          className="flex w-full items-center justify-between rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#D94320]"
        >
          Launch Lesson
          <ArrowUpRight size={17} />
        </Link>
      </div>

    </article>
  );
};

export default CompanionCard;