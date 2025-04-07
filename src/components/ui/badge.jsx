import * as React from "react"
import { cn } from "@/lib/utils"

const variants = {
  default: "bg-primary text-primary-foreground hover:bg-primary/80",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  outline: "border border-input hover:bg-accent hover:text-accent-foreground",
  success: "border border-green-200 bg-green-100 text-green-800 hover:bg-green-200",
  warning: "border border-yellow-200 bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
  destructive: "border border-red-200 bg-red-100 text-red-800 hover:bg-red-200",
  info: "border border-blue-200 bg-blue-100 text-blue-800 hover:bg-blue-200"
};

function Badge({
  className,
  variant = "default",
  ...props
}) {
  return (
    <div 
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        variants[variant],
        className
      )} 
      {...props} 
    />
  )
}

export { Badge }