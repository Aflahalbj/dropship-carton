
import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"

import { cn } from "@/lib/utils"
import { useLocation } from 'react-router-dom'

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
      className
    )}
    {...props}
  />
))
Avatar.displayName = AvatarPrimitive.Root.displayName

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, src, ...props }, ref) => {
  const location = useLocation();
  const isInventoryPage = location.pathname === "/inventory";
  
  // Don't show images on inventory page but show on POS and purchases pages
  if (isInventoryPage) {
    return null;
  }
  
  // Only render the image if there's a valid src and it's not a placeholder URL
  const isPlaceholder = src?.includes('placehold.co');
  if (!src || isPlaceholder) {
    return null;
  }
  
  return (
    <AvatarPrimitive.Image
      ref={ref}
      src={src}
      className={cn("aspect-square h-full w-full", className)}
      {...props}
    />
  );
})
AvatarImage.displayName = AvatarPrimitive.Image.displayName

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, children, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted text-muted-foreground font-medium uppercase",
      className
    )}
    {...props}
  >
    {children || (typeof props['aria-label'] === 'string' ? props['aria-label'].charAt(0) : '?')}
  </AvatarPrimitive.Fallback>
))
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

export { Avatar, AvatarImage, AvatarFallback }
