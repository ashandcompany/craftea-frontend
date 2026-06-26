import { describe, it, expect } from 'vitest'
import {
  formatPhotonLabel,
  photonToLatLng,
  photonToAddressFields,
  photonCountryToCode,
} from './photon'

type Feature = Parameters<typeof formatPhotonLabel>[0]

const makeFeature = (
  props: Partial<Feature['properties']> = {},
  coords: [number, number] = [2.3488, 48.8534],
): Feature => ({
  geometry: { coordinates: coords },
  properties: { type: 'city', ...props },
})

describe('formatPhotonLabel', () => {
  it('inclut le nom, la ville et le pays', () => {
    const f = makeFeature({ name: 'Tour Eiffel', city: 'Paris', country: 'France' })
    expect(formatPhotonLabel(f)).toBe('Tour Eiffel, Paris, France')
  })

  it('affiche rue + numéro quand les deux sont présents', () => {
    const f = makeFeature({ housenumber: '5', street: 'Rue de Rivoli', city: 'Paris', country: 'France' })
    expect(formatPhotonLabel(f)).toBe('5 Rue de Rivoli, Paris, France')
  })

  it('affiche juste la rue sans numéro', () => {
    const f = makeFeature({ street: 'Avenue des Champs-Élysées', city: 'Paris', country: 'France' })
    expect(formatPhotonLabel(f)).toBe('Avenue des Champs-Élysées, Paris, France')
  })

  it('affiche code postal + ville quand les deux sont présents', () => {
    const f = makeFeature({ postcode: '75001', city: 'Paris', country: 'France' })
    expect(formatPhotonLabel(f)).toBe('75001 Paris, France')
  })

  it('affiche juste la ville sans code postal', () => {
    const f = makeFeature({ city: 'Lyon', country: 'France' })
    expect(formatPhotonLabel(f)).toBe('Lyon, France')
  })

  it('filtre les champs vides / undefined', () => {
    const f = makeFeature({ country: 'France' })
    expect(formatPhotonLabel(f)).toBe('France')
  })

  it('retourne une chaîne vide si aucune propriété', () => {
    const f = makeFeature()
    expect(formatPhotonLabel(f)).toBe('')
  })
})

describe('photonToLatLng', () => {
  it('inverse lon/lat en [lat, lon] pour Leaflet', () => {
    const f = makeFeature({}, [2.3488, 48.8534])
    const [lat, lon] = photonToLatLng(f)
    expect(lat).toBe(48.8534)
    expect(lon).toBe(2.3488)
  })

  it('gère les coordonnées négatives', () => {
    const f = makeFeature({}, [-0.1276, 51.5074])
    const [lat, lon] = photonToLatLng(f)
    expect(lat).toBe(51.5074)
    expect(lon).toBe(-0.1276)
  })

  it('retourne un tuple [number, number]', () => {
    const result = photonToLatLng(makeFeature({}, [0, 0]))
    expect(result).toHaveLength(2)
    expect(typeof result[0]).toBe('number')
    expect(typeof result[1]).toBe('number')
  })
})

describe('photonToAddressFields', () => {
  it('extrait tous les champs quand tout est présent', () => {
    const f = makeFeature({
      housenumber: '12',
      street: 'Rue du Faubourg',
      city: 'Paris',
      postcode: '75011',
      country: 'France',
    })
    const fields = photonToAddressFields(f)
    expect(fields.street).toBe('12 Rue du Faubourg')
    expect(fields.city).toBe('Paris')
    expect(fields.postal_code).toBe('75011')
    expect(fields.country).toBe('France')
  })

  it('retourne une rue sans numéro quand housenumber absent', () => {
    const f = makeFeature({ street: 'Boulevard Haussmann' })
    expect(photonToAddressFields(f).street).toBe('Boulevard Haussmann')
  })

  it('retourne une rue vide quand street et housenumber absents', () => {
    const f = makeFeature({ city: 'Marseille' })
    expect(photonToAddressFields(f).street).toBe('')
  })

  it('retourne des chaînes vides pour les champs absents', () => {
    const f = makeFeature()
    const fields = photonToAddressFields(f)
    expect(fields.city).toBe('')
    expect(fields.postal_code).toBe('')
    expect(fields.country).toBe('')
  })
})

describe('photonCountryToCode', () => {
  it('convertit les pays francophones courants', () => {
    expect(photonCountryToCode('France')).toBe('FR')
    expect(photonCountryToCode('Belgique')).toBe('BE')
    expect(photonCountryToCode('Suisse')).toBe('CH')
    expect(photonCountryToCode('Luxembourg')).toBe('LU')
  })

  it('est insensible à la casse', () => {
    expect(photonCountryToCode('france')).toBe('FR')
    expect(photonCountryToCode('FRANCE')).toBe('FR')
    expect(photonCountryToCode('France')).toBe('FR')
  })

  it('convertit les autres pays', () => {
    expect(photonCountryToCode('Allemagne')).toBe('DE')
    expect(photonCountryToCode('Espagne')).toBe('ES')
    expect(photonCountryToCode('Italie')).toBe('IT')
    expect(photonCountryToCode('Royaume-Uni')).toBe('GB')
    expect(photonCountryToCode('États-Unis')).toBe('US')
    expect(photonCountryToCode('Canada')).toBe('CA')
    expect(photonCountryToCode('Japon')).toBe('JP')
    expect(photonCountryToCode('Australie')).toBe('AU')
  })

  it('retourne une chaîne vide pour un pays inconnu', () => {
    expect(photonCountryToCode('Atlantide')).toBe('')
    expect(photonCountryToCode('')).toBe('')
  })
})
