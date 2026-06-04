import { cn } from "@/lib/utils"

<<<<<<< HEAD
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md bg-accent", className)}
=======
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted",
        className
      )}
>>>>>>> dd36b09c5ae205bf3620780153084dca831d8f9f
      {...props}
    />
  )
}

<<<<<<< HEAD
export { Skeleton }
=======
export { Skeleton }
>>>>>>> dd36b09c5ae205bf3620780153084dca831d8f9f
