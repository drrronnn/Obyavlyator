import { useRef, useMemo } from "react"

export function useCachedValue<T>(value: T, isValid: (v: T) => boolean = v => v !== undefined && v !== null): T | undefined {
  const ref = useRef<T | undefined>(undefined)

  return useMemo(() => {
    if (isValid(value)) {
      ref.current = value
    }
    return ref.current
  }, [value, isValid])
}
