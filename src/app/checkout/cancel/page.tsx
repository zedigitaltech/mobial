"use client"

import { motion } from "framer-motion"
import { XCircle, ShoppingCart, ArrowRight } from "lucide-react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"

export default function CheckoutCancelPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto"
          >
            <Card>
              <CardContent className="pt-8 text-center space-y-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.2 }}
                  className="mx-auto h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center"
                >
                  <XCircle className="h-10 w-10 text-muted-foreground" />
                </motion.div>

                <div className="space-y-2">
                  <h1 className="text-2xl font-bold">Payment Cancelled</h1>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Your payment was not completed. No charges have been made.
                    Your cart items are still saved if you'd like to try again.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                  <Link href="/checkout">
                    <Button size="lg" className="w-full sm:w-auto gradient-accent text-accent-foreground">
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Return to Cart
                    </Button>
                  </Link>
                  <Link href="/products">
                    <Button variant="outline" size="lg" className="w-full sm:w-auto">
                      Continue Shopping
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <div className="mt-8 text-center text-sm text-muted-foreground">
              <p>
                Having trouble?{" "}
                <Link href="/contact" className="text-primary hover:underline">
                  Contact our support team
                </Link>
              </p>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
