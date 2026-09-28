import { useEffect } from "react"

export default function PremiumCursor() {
  useEffect(() => {
    document.documentElement.style.cursor = ""
    document.body.style.cursor = ""
  }, [])

  return null
}
