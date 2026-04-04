import { cn } from "@/lib/utils";

const variants: Record<string, string> = {
  merchant: "bg-blue-50 text-blue-700",
  partner: "bg-indigo-50 text-indigo-700",
  verified: "bg-green-50 text-green-700",
  default: "bg-gray-100 text-gray-700",
};

export default function Badge({
  variant = "default",
  children,
  className,
}: {
  variant?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
        variants[variant] || variants.default,
        className
      )}
    >
      {children}
    </span>
  );
}
