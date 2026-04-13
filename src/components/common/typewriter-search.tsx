"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Search, X } from "lucide-react"
import { cn } from "@/lib/utils"

const TYPEWRITER_WORDS = [
  "Tokyo, Japan",
  "Istanbul, Turkey",
  "New York, USA",
  "Bangkok, Thailand",
  "Paris, France",
  "Bali, Indonesia",
  "Barcelona, Spain",
  "Dubai, UAE",
  "Rome, Italy",
  "London, UK",
  "Sydney, Australia",
  "Seoul, South Korea",
  "Cancun, Mexico",
  "Santorini, Greece",
  "Phuket, Thailand",
  "Amsterdam, Netherlands",
  "Maldives",
  "Lisbon, Portugal",
  "Cairo, Egypt",
  "Singapore",
]

function useTypewriter(
  words: readonly string[],
  speed = 70,
  pause = 1800,
): string {
  const [text, setText] = useState("")
  const [wordIndex, setWordIndex] = useState(0)
  const [phase, setPhase] = useState<"typing" | "deleting">("typing")

  useEffect(() => {
    const currentWord = words[wordIndex % words.length]

    const delay = phase === "typing"
      ? (text.length < currentWord.length ? speed : pause)
      : speed / 2

    const timeout = setTimeout(() => {
      if (phase === "typing") {
        if (text.length < currentWord.length) {
          setText(currentWord.slice(0, text.length + 1))
        } else {
          setPhase("deleting")
        }
      } else {
        if (text.length > 0) {
          setText(currentWord.slice(0, text.length - 1))
        } else {
          setWordIndex((i) => (i + 1) % words.length)
          setPhase("typing")
        }
      }
    }, delay)

    return () => clearTimeout(timeout)
  }, [text, phase, wordIndex, words, speed, pause])

  return text
}

interface TypewriterSearchProps {
  placeholder?: string
  onSearch: (query: string) => void
  className?: string
}

export function TypewriterSearch({
  placeholder = "Search for a destination...",
  onSearch,
  className,
}: TypewriterSearchProps) {
  const [value, setValue] = useState("")
  const [isFocused, setIsFocused] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const typedWord = useTypewriter(TYPEWRITER_WORDS)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const handleChange = useCallback(
    (text: string) => {
      setValue(text)
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => onSearch(text), 300)
    },
    [onSearch],
  )

  const handleClear = useCallback(() => {
    setValue("")
    onSearch("")
    inputRef.current?.focus()
  }, [onSearch])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && value.trim()) {
        onSearch(value)
      }
    },
    [value, onSearch],
  )

  const showTypewriter = !isFocused && value.length === 0

  return (
    <div
      className={cn(
        "relative flex items-center gap-2 rounded-2xl bg-muted/60 px-4 h-12",
        "focus-within:ring-2 focus-within:ring-primary/20 transition-all",
        className,
      )}
    >
      <Search className="h-[18px] w-[18px] text-muted-foreground shrink-0" />
      <div className="relative flex-1">
        <input
          ref={inputRef}
          type="text"
          className="w-full h-full bg-transparent border-0 text-[15px] font-medium outline-none placeholder:text-muted-foreground"
          placeholder={showTypewriter ? "" : placeholder}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          autoCapitalize="none"
          autoCorrect="off"
        />
        {showTypewriter && (
          <div className="absolute inset-0 flex items-center pointer-events-none">
            <span className="text-[15px] font-medium text-muted-foreground">
              {typedWord}
              <span className="text-primary animate-pulse">|</span>
            </span>
          </div>
        )}
      </div>
      {value.length > 0 && (
        <button
          onClick={handleClear}
          className="shrink-0 p-1 rounded-full hover:bg-muted transition-colors"
          type="button"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      )}
    </div>
  )
}
