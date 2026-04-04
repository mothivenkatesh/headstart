import { cn } from "@/lib/utils";

const variantStyles: Record<string, string> = {
  primary: "bg-brand-btn text-white hover:bg-brand-btn-hover active:bg-brand-btn-active active:scale-[0.98]",
  outline: "border border-border text-text-primary bg-white hover:bg-gray-50 active:bg-gray-100 active:scale-[0.98]",
  ghost: "text-text-secondary hover:bg-gray-100 active:bg-gray-200 active:scale-[0.98]",
};

const sizeStyles: Record<string, string> = {
  sm: "h-8 px-3 text-[13px] gap-1.5",
  md: "h-10 px-4 text-[14px] gap-2",
  lg: "h-12 px-6 text-[15px] gap-2",
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

export default function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 select-none",
        "disabled:opacity-50 disabled:pointer-events-none disabled:shadow-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 focus-visible:ring-offset-1",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
