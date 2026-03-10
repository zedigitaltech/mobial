"use client"

import { motion } from "framer-motion"
import { Search, Home, ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 blur-[150px] rounded-full" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center space-y-8 max-w-lg mx-auto"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-[10rem] md:text-[12rem] font-black leading-none tracking-tighter text-primary/20 select-none"
        >
          404
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="space-y-4 -mt-12"
        >
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">Page Not Found</h1>
          <p className="text-muted-foreground font-medium max-w-md mx-auto">
            The page you're looking for doesn't exist or has been moved. Try searching for what you
            need or head back home.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Button size="lg" className="rounded-2xl px-8 h-14 font-black w-full sm:w-auto" asChild>
            <Link href="/">
              <Home className="mr-2 h-5 w-5" />
              Go Home
            </Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="rounded-2xl px-8 h-14 font-black border-2 w-full sm:w-auto"
            asChild
          >
            <Link href="/products">
              <ShoppingBag className="mr-2 h-5 w-5" />
              Browse eSIMs
            </Link>
          </Button>
        </motion.div>
      </motion.div>
    </div>
  )
}
