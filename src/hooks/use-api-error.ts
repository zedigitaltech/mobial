"use client"

import { toast } from "sonner"

/**
 * Handle API errors with user-friendly toast notifications
 */
export function useApiError() {
  const handleError = (error: unknown, customMessage?: string) => {
    console.error("API Error:", error)

    let message = customMessage || "An unexpected error occurred"
    let status: number | undefined

    if (error instanceof Response) {
      status = error.status
      if (status === 401) {
        message = "Please log in to continue"
        localStorage.removeItem("token")
        localStorage.removeItem("refreshToken")
        setTimeout(() => {
          window.location.href = "/#auth"
        }, 1000)
      } else if (status === 403) {
        message = "You don't have permission to perform this action"
      } else if (status === 404) {
        message = "The requested resource was not found"
      } else if (status === 429) {
        message = "Too many requests. Please try again later"
      } else if (status >= 500) {
        message = "A server error occurred. Please try again later"
      }
    } else if (error instanceof Error) {
      message = error.message
    } else if (typeof error === "string") {
      message = error
    }

    toast.error(message, {
      duration: 5000,
      description: status ? `Error ${status}` : undefined,
    })

    return { message, status }
  }

  const handleSuccess = (message: string) => {
    toast.success(message, {
      duration: 3000,
    })
  }

  return {
    handleError,
    handleSuccess,
  }
}
