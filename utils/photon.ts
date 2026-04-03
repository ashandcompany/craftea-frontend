import type { PhotonFeature } from '@/hooks/usePhotonSearch'

export function formatPhotonLabel(f: PhotonFeature): string {
  const p = f.properties
  const parts = [
    p.name,
    p.housenumber && p.street ? `${p.housenumber} ${p.street}` : p.street,
    p.postcode && p.city ? `${p.postcode} ${p.city}` : p.city,
    p.country,
  ].filter(Boolean)
  return parts.join(', ')
}

// Coordonnées GeoJSON → Leaflet [lat, lon]
export function photonToLatLng(f: PhotonFeature): [number, number] {
  const [lon, lat] = f.geometry.coordinates
  return [lat, lon]
}

// Feature Photon → champs d'adresse (settings / formulaires)
export function photonToAddressFields(f: PhotonFeature) {
  const p = f.properties
  const streetParts = [p.housenumber, p.street].filter(Boolean)
  return {
    street: streetParts.join(' '),
    city: p.city ?? '',
    postal_code: p.postcode ?? '',
    country: p.country ?? '',
  }
}

// Nom de pays (retourné en français par Photon) → code ISO 2
const COUNTRY_NAME_TO_CODE: Record<string, string> = {
  france: 'FR',
  belgique: 'BE',
  suisse: 'CH',
  luxembourg: 'LU',
  allemagne: 'DE',
  espagne: 'ES',
  italie: 'IT',
  'royaume-uni': 'GB',
  'états-unis': 'US',
  canada: 'CA',
  japon: 'JP',
  australie: 'AU',
}

export function photonCountryToCode(country: string): string {
  return COUNTRY_NAME_TO_CODE[country.toLowerCase()] ?? ''
}
