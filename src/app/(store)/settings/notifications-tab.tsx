"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Bell } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

export function NotificationsTab() {
  const [orderUpdates, setOrderUpdates] = useState(true)
  const [promotions, setPromotions] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-xl font-black flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Notifications
          </CardTitle>
          <CardDescription>Manage your email notification preferences.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50">
            <div className="space-y-0.5">
              <Label className="text-sm font-bold">Order updates</Label>
              <p className="text-xs text-muted-foreground">
                Receive emails about your eSIM orders, activations, and delivery.
              </p>
            </div>
            <Switch
              checked={orderUpdates}
              onCheckedChange={setOrderUpdates}
              aria-label="Order updates"
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50">
            <div className="space-y-0.5">
              <Label className="text-sm font-bold">Promotional emails</Label>
              <p className="text-xs text-muted-foreground">
                Receive deals, travel tips, and special offers from Mobialo.
              </p>
            </div>
            <Switch
              checked={promotions}
              onCheckedChange={setPromotions}
              aria-label="Promotional emails"
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
