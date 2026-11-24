import Link from "next/link";
import Image from "next/image";
import { Plus, Sparkles } from "lucide-react";

const CTA = () => {
  return (
    <section className="cta-section">

      {/* Badge */}
      <div className="cta-badge flex items-center gap-2">
        <Sparkles size={14} />
        Personalised Learning
      </div>

      {/* Heading */}
      <h2 className="text-2xl font-bold leading-tight text-white">
        Learning without limits.
      </h2>

      {/* Description */}
      <p className="text-sm leading-relaxed text-slate-300">
        Create your own AI companion, explore any subject
        and learn at your own pace through interactive
        voice conversations.
      </p>

      {/* Illustration */}
      <Image
        src="/images/cta.svg"
        alt="Personalised AI learning"
        width={220}
        height={180}
        className="my-2 h-auto w-full max-w-[220px]"
      />

      {/* Create Companion Button */}
      <Link
        href="/companions/new"
        className="btn-primary mt-auto w-full"
      >
        <Plus size={18} />
        Create a Companion
      </Link>

      <p className="text-xs text-slate-400">
        Your next learning adventure starts here.
      </p>

    </section>
  );
};

export default CTA;