"use client"

import { useState } from "react"
import { AnimatePresence } from "framer-motion"
import { X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { LoginForm } from "./login-form"
import { RegisterForm } from "./register-form"

interface AuthModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultView?: "login" | "register"
}

export function AuthModal({ open, onOpenChange, defaultView = "login" }: AuthModalProps) {
  const [view, setView] = useState<"login" | "register">(defaultView)

  const handleSuccess = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>{view === "login" ? "Sign In" : "Create Account"}</DialogTitle>
        </DialogHeader>
        <div className="p-6">
          <AnimatePresence mode="wait">
            {view === "login" ? (
              <LoginForm
                key="login"
                onSuccess={handleSuccess}
                onSwitchToRegister={() => setView("register")}
              />
            ) : (
              <RegisterForm
                key="register"
                onSuccess={handleSuccess}
                onSwitchToLogin={() => setView("login")}
              />
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  )
}
