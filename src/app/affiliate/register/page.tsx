"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  User,
  Building2,
  Globe,
  Wallet,
  FileText,
  Check,
  Loader2,
  ArrowRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAffiliateAuth } from "@/hooks/use-affiliate-auth"
import { useToast } from "@/hooks/use-toast"

const paymentMethods = [
  { value: "bank", label: "Bank Transfer", description: "Direct deposit to your bank account" },
  { value: "paypal", label: "PayPal", description: "Receive payments via PayPal" },
  { value: "wise", label: "Wise", description: "International transfers with Wise" },
  { value: "crypto", label: "Cryptocurrency (USDT)", description: "Receive USDT on TRC20 or ERC20" },
]

const benefits = [
  "Earn up to 15% commission on every sale",
  "Real-time tracking and analytics",
  "Monthly payouts with low $50 minimum",
  "Dedicated affiliate support team",
  "Marketing materials provided",
  "No hidden fees or costs",
]

export default function AffiliateRegisterPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [formData, setFormData] = useState({
    companyName: "",
    website: "",
    paymentMethod: "",
    paymentDetails: "",
    taxId: "",
    termsAccepted: false,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { refresh } = useAffiliateAuth()
  const router = useRouter()
  const { toast } = useToast()

  function validateForm() {
    const newErrors: Record<string, string> = {}

    if (!formData.paymentMethod) {
      newErrors.paymentMethod = "Payment method is required"
    }

    if (!formData.paymentDetails.trim()) {
      newErrors.paymentDetails = "Payment details are required"
    }

    if (formData.website && !isValidUrl(formData.website)) {
      newErrors.website = "Please enter a valid URL"
    }

    if (!formData.termsAccepted) {
      newErrors.termsAccepted = "You must accept the terms and conditions"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function isValidUrl(url: string) {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/")
        return
      }

      const res = await fetch("/api/affiliate/register", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          companyName: formData.companyName || undefined,
          website: formData.website || undefined,
          paymentMethod: formData.paymentMethod,
          paymentDetails: formData.paymentDetails,
          taxId: formData.taxId || undefined,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to register")
      }

      setIsSuccess(true)
      await refresh()
      
      toast({
        title: "Application submitted!",
        description: "We'll review your application and get back to you soon.",
      })
    } catch (error) {
      console.error("Registration error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit application",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Card className="border-emerald-200 dark:border-emerald-900">
            <CardContent className="pt-8 pb-8">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-6">
                <Check className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Application Submitted!</h2>
              <p className="text-muted-foreground mb-6">
                Thank you for applying to the MobiaL Affiliate Program. Our team will
                review your application and get back to you within 1-2 business days.
              </p>
              <div className="bg-muted/50 rounded-lg p-4 mb-6">
                <h3 className="font-medium mb-2">What happens next?</h3>
                <ul className="text-sm text-muted-foreground space-y-2 text-left">
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                    <span>Our team will review your application</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                    <span>You&apos;ll receive an email with the approval status</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                    <span>Once approved, you can start earning commissions</span>
                  </li>
                </ul>
              </div>
              <Button onClick={() => router.push("/affiliate")} className="gradient-accent">
                Go to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Become an Affiliate</h1>
          <p className="text-muted-foreground">
            Join our affiliate program and start earning commissions
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Benefits */}
          <div className="lg:col-span-1">
            <Card className="h-fit bg-muted/50">
              <CardHeader>
                <CardTitle className="text-lg">Program Benefits</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                      <span className="text-sm">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Registration Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Affiliate Application</CardTitle>
                <CardDescription>
                  Fill out the form below to apply for the affiliate program
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Company Info */}
                  <div className="space-y-4">
                    <h3 className="font-medium flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Company Information (Optional)
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="companyName">Company Name</Label>
                        <Input
                          id="companyName"
                          placeholder="Your company name"
                          value={formData.companyName}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              companyName: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="website">Website</Label>
                        <div className="relative">
                          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="website"
                            placeholder="https://yourwebsite.com"
                            className="pl-9"
                            value={formData.website}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                website: e.target.value,
                              }))
                            }
                          />
                        </div>
                        {errors.website && (
                          <p className="text-xs text-destructive">{errors.website}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div className="space-y-4">
                    <h3 className="font-medium flex items-center gap-2">
                      <Wallet className="h-4 w-4" />
                      Payment Method
                    </h3>
                    <div className="space-y-2">
                      <Label htmlFor="paymentMethod">Payment Method *</Label>
                      <Select
                        value={formData.paymentMethod}
                        onValueChange={(value) =>
                          setFormData((prev) => ({
                            ...prev,
                            paymentMethod: value,
                          }))
                        }
                      >
                        <SelectTrigger
                          className={errors.paymentMethod ? "border-destructive" : ""}
                        >
                          <SelectValue placeholder="Select a payment method" />
                        </SelectTrigger>
                        <SelectContent>
                          {paymentMethods.map((method) => (
                            <SelectItem key={method.value} value={method.value}>
                              <div>
                                <span className="font-medium">{method.label}</span>
                                <span className="text-xs text-muted-foreground ml-2">
                                  {method.description}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.paymentMethod && (
                        <p className="text-xs text-destructive">{errors.paymentMethod}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="paymentDetails">Payment Details *</Label>
                      <Textarea
                        id="paymentDetails"
                        placeholder={
                          formData.paymentMethod === "paypal"
                            ? "Your PayPal email address"
                            : formData.paymentMethod === "bank"
                            ? "Bank name, Account number, Routing number, Account holder name"
                            : formData.paymentMethod === "crypto"
                            ? "Your USDT wallet address (TRC20 or ERC20)"
                            : formData.paymentMethod === "wise"
                            ? "Your Wise email or account details"
                            : "Enter your payment details"
                        }
                        value={formData.paymentDetails}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            paymentDetails: e.target.value,
                          }))
                        }
                        className={errors.paymentDetails ? "border-destructive" : ""}
                        rows={3}
                      />
                      {errors.paymentDetails && (
                        <p className="text-xs text-destructive">{errors.paymentDetails}</p>
                      )}
                    </div>
                  </div>

                  {/* Tax Info */}
                  <div className="space-y-4">
                    <h3 className="font-medium flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Tax Information (Optional)
                    </h3>
                    <div className="space-y-2">
                      <Label htmlFor="taxId">Tax ID / VAT Number</Label>
                      <Input
                        id="taxId"
                        placeholder="For tax reporting purposes"
                        value={formData.taxId}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            taxId: e.target.value,
                          }))
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        Required for US affiliates earning over $600/year
                      </p>
                    </div>
                  </div>

                  {/* Terms */}
                  <div className="space-y-4">
                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id="terms"
                        checked={formData.termsAccepted}
                        onCheckedChange={(checked) =>
                          setFormData((prev) => ({
                            ...prev,
                            termsAccepted: checked as boolean,
                          }))
                        }
                        className={errors.termsAccepted ? "border-destructive" : ""}
                      />
                      <Label htmlFor="terms" className="text-sm leading-normal">
                        I agree to the{" "}
                        <a href="/terms" className="text-primary underline">
                          Terms of Service
                        </a>{" "}
                        and{" "}
                        <a href="/affiliate-terms" className="text-primary underline">
                          Affiliate Agreement
                        </a>
                        . I understand that commissions are paid on approved sales only
                        and that MobiaL reserves the right to reject applications.
                      </Label>
                    </div>
                    {errors.termsAccepted && (
                      <p className="text-xs text-destructive">{errors.termsAccepted}</p>
                    )}
                  </div>

                  {/* Submit */}
                  <Button
                    type="submit"
                    className="w-full gradient-accent"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        Submit Application
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
