"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--success-bg": "hsl(142, 76%, 36%)",
          "--success-text": "hsl(355, 7%, 97%)",
          "--success-border": "hsl(142, 76%, 36%)",
          "--error-bg": "hsl(0, 84%, 60%)",
          "--error-text": "hsl(355, 7%, 97%)",
          "--error-border": "hsl(0, 84%, 60%)",
          "--warning-bg": "hsl(38, 92%, 50%)",
          "--warning-text": "hsl(355, 7%, 97%)",
          "--warning-border": "hsl(38, 92%, 50%)",
          "--info-bg": "hsl(199, 89%, 48%)",
          "--info-text": "hsl(355, 7%, 97%)",
          "--info-border": "hsl(199, 89%, 48%)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          success: "bg-green-600 text-white border-green-600",
          error: "bg-red-600 text-white border-red-600",
          warning: "bg-orange-500 text-white border-orange-500",
          info: "bg-blue-600 text-white border-blue-600",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
