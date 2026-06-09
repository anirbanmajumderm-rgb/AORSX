import { forwardRef, type HTMLAttributes } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

const Avatar = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full border border-white/10",
        className
      )}
      {...props}
    />
  )
);
Avatar.displayName = "Avatar";

const AvatarImage = forwardRef<HTMLImageElement, HTMLAttributes<HTMLImageElement>>(
  ({ className, ...props }, ref) => {
    const src = (props as any).src;
    if (!src || typeof src !== "string") {
      return (
        <img
          ref={ref}
          className={cn("aspect-square h-full w-full object-cover", className)}
          {...props}
        />
      );
    }
    return (
      <Image
        ref={ref as any}
        src={src}
        alt={(props as any).alt || ""}
        width={40}
        height={40}
        className={cn("aspect-square h-full w-full object-cover", className)}
      />
    );
  }
);
AvatarImage.displayName = "AvatarImage";

const AvatarFallback = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-neon-orange/20 to-neon-cyan/20 text-sm font-medium text-white/70",
        className
      )}
      {...props}
    />
  )
);
AvatarFallback.displayName = "AvatarFallback";

export { Avatar, AvatarImage, AvatarFallback };
