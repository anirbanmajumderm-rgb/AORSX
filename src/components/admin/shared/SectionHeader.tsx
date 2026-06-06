import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function SectionHeader({ title, description, action, className }: SectionHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between mb-5", className)}>
      <div>
        <h3 className="font-heading text-base font-bold">{title}</h3>
        {description && (
          <p className="text-xs text-white/30 mt-0.5">{description}</p>
        )}
      </div>
      {action && (
        <div>{action}</div>
      )}
    </div>
  );
}
