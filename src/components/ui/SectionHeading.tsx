import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  label?: string;
  title: string;
  description?: string;
  className?: string;
  align?: "left" | "center";
}

export function SectionHeading({
  label,
  title,
  description,
  className,
  align = "center",
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "max-w-3xl mb-16 md:mb-20 animate-on-scroll",
        align === "center" && "mx-auto text-center",
        align === "left" && "text-left",
        className
      )}
    >
      {label && (
        <span
          className="inline-block px-4 py-1.5 text-xs font-semibold tracking-[0.2em] uppercase text-cyan bg-cyan/10 border border-cyan/20 rounded-full mb-4 animate-on-scroll-stagger"
        >
          {label}
        </span>
      )}
      <h2
        className={cn(
          "text-3xl md:text-4xl lg:text-5xl font-bold font-heading tracking-tight text-main-text",
          "leading-[1.15] animate-on-scroll-stagger"
        )}
      >
        {title}
      </h2>
      {description && (
        <p
          className="mt-5 text-lg text-secondary-text leading-relaxed max-w-2xl mx-auto animate-on-scroll-stagger"
        >
          {description}
        </p>
      )}
    </div>
  );
}
