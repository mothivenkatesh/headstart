import Image from "next/image";
import { strapiMedia } from "@/lib/strapi";
import { cn } from "@/lib/utils";

const sizes = {
  xs: "w-5 h-5 text-[8px]",
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-16 h-16 text-xl",
  xl: "w-24 h-24 text-3xl",
};

interface AvatarProps {
  src?: { url: string } | null;
  name?: string;
  size?: keyof typeof sizes;
  className?: string;
}

export default function Avatar({ src, name, size = "md", className }: AvatarProps) {
  const url = strapiMedia(src);
  const initials = (name || "?").charAt(0).toUpperCase();

  return (
    <div
      className={cn(
        "rounded-full bg-brand-light text-brand font-semibold flex items-center justify-center overflow-hidden shrink-0",
        sizes[size],
        className
      )}
    >
      {url ? (
        <Image src={url} alt={name || ""} width={96} height={96} className="w-full h-full object-cover" />
      ) : (
        initials
      )}
    </div>
  );
}
