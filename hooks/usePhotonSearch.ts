import { useState, useRef, useCallback } from 'react'

export interface PhotonFeature {
  geometry: { coordinates: [number, number] }
  properties: {
    name?: string
    city?: string
    country?: string
    postcode?: string
    street?: string
    housenumber?: string
    type: string
  }
}

export function usePhotonSearch() {
  const [results, setResults] = useState<PhotonFeature[]>([])
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const search = useCallback((query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (query.length < 3) { setResults([]); return }

    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams({
          q: query,
          limit: '5',
          lang: 'fr',
        })
        const res = await fetch(`https://photon.komoot.io/api/?${params}`)
        const data = await res.json()
        setResults(data.features ?? [])
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300)
  }, [])

  return { results, loading, search, setResults }
}
