import { Metadata } from "next"
import Link from "next/link"
import { RegisterForm } from "@/components/auth/register-form"

export const metadata: Metadata = {
  title: "Create Account | Mobialo",
  description: "Create your free Mobialo account and get instant access to eSIM plans for 150+ countries.",
}

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>
}) {
  const { callbackUrl: rawCallback } = await searchParams
  // Sanitize: only allow relative paths (no open-redirect via external URLs)
  const callbackUrl =
    rawCallback &&
    rawCallback.startsWith("/") &&
    !rawCallback.startsWith("//")
      ? rawCallback
      : "/dashboard"

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="text-sm text-muted-foreground">
            Get instant access to eSIM plans for 150+ countries
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-border bg-card space-y-6">
          <RegisterForm callbackUrl={callbackUrl} />
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
            className="text-primary hover:underline font-medium"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
