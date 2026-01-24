import { cn } from "@/lib/utils";

interface BorderBeamProps {
  className?: string;
  size?: number;
  duration?: number;
  delay?: number;
  colorFrom?: string;
  colorTo?: string;
}

export const BorderBeam = ({
  className,
  size = 200,
  duration = 12,
  delay = 0,
  colorFrom = "hsl(var(--primary))",
  colorTo = "hsl(var(--primary) / 0.3)",
}: BorderBeamProps) => {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 rounded-[inherit] overflow-hidden",
        className
      )}
    >
      <div
        className="absolute inset-[-200%] animate-border-beam"
        style={{
          background: `conic-gradient(from 0deg at 50% 50%, transparent 0deg, ${colorFrom} 60deg, ${colorTo} 120deg, transparent 180deg)`,
          animationDuration: `${duration}s`,
          animationDelay: `${delay}s`,
          width: `${size}%`,
          height: `${size}%`,
        }}
      />
      {/* Inner mask to cut out the center */}
      <div className="absolute inset-[1px] rounded-[inherit] bg-card" />
    </div>
  );
};
