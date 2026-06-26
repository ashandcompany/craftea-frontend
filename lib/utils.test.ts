import { describe, it, expect } from 'vitest'
import { cn, calculateFeeEur, assetUrl, COMMISSION, STRIPE_FEES } from './utils'

describe('cn', () => {
  it('merges multiple class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('ignore les valeurs falsy', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(cn('foo', false as any, undefined, null as any, 'baz')).toBe('foo baz')
  })

  it('résout les conflits tailwind (dernière valeur gagne)', () => {
    expect(cn('p-4', 'p-8')).toBe('p-8')
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
  })

  it('retourne une chaîne vide sans argument', () => {
    expect(cn()).toBe('')
  })

  it('gère les tableaux de classes', () => {
    expect(cn(['foo', 'bar'], 'baz')).toBe('foo bar baz')
  })
})

describe('COMMISSION', () => {
  it('taux à 5%', () => {
    expect(COMMISSION.RATE).toBe(0.05)
  })

  it('frais fixe à 0.25€', () => {
    expect(COMMISSION.FIXED_EUR).toBe(0.25)
  })
})

describe('STRIPE_FEES', () => {
  it('EEA : 1.5% + 0.25€', () => {
    expect(STRIPE_FEES.EEA.rate).toBe(0.015)
    expect(STRIPE_FEES.EEA.fixedEur).toBe(0.25)
  })

  it('UK : 2.5% + 0.25€', () => {
    expect(STRIPE_FEES.UK.rate).toBe(0.025)
    expect(STRIPE_FEES.UK.fixedEur).toBe(0.25)
  })
})

describe('calculateFeeEur', () => {
  it('0€ → uniquement le fixe (0.25€)', () => {
    expect(calculateFeeEur(0)).toBeCloseTo(0.25)
  })

  it('10€ → 5%×10 + 0.25 = 0.75€', () => {
    expect(calculateFeeEur(10)).toBeCloseTo(0.75)
  })

  it('100€ → 5%×100 + 0.25 = 5.25€', () => {
    expect(calculateFeeEur(100)).toBeCloseTo(5.25)
  })

  it('50€ → 2.75€', () => {
    expect(calculateFeeEur(50)).toBeCloseTo(2.75)
  })

  it('respecte la formule amount * RATE + FIXED_EUR', () => {
    const amount = 37.5
    expect(calculateFeeEur(amount)).toBeCloseTo(amount * COMMISSION.RATE + COMMISSION.FIXED_EUR)
  })
})

describe('assetUrl', () => {
  it('retourne une chaîne vide pour null', () => {
    expect(assetUrl(null)).toBe('')
  })

  it('retourne une chaîne vide pour undefined', () => {
    expect(assetUrl(undefined)).toBe('')
  })

  it('laisse passer les URLs https absolues', () => {
    expect(assetUrl('https://cdn.example.com/img.jpg')).toBe('https://cdn.example.com/img.jpg')
  })

  it('laisse passer les URLs http absolues', () => {
    expect(assetUrl('http://localhost:9000/img.jpg')).toBe('http://localhost:9000/img.jpg')
  })

  it('laisse passer les blob URLs', () => {
    expect(assetUrl('blob:http://localhost/abc-123')).toBe('blob:http://localhost/abc-123')
  })

  it('laisse passer les data URLs', () => {
    expect(assetUrl('data:image/png;base64,abc==')).toBe('data:image/png;base64,abc==')
  })

  it('retourne la valeur brute sans bucket', () => {
    expect(assetUrl('relative/path.jpg')).toBe('relative/path.jpg')
  })

  it('construit l\'URL MinIO pour un fichier sans préfixe', () => {
    const url = assetUrl('photo.jpg', 'product-images')
    expect(url).toBe('http://localhost:9000/product-images/photo.jpg')
  })

  it('évite le double préfixe de bucket', () => {
    const url = assetUrl('product-images/photo.jpg', 'product-images')
    expect(url).toBe('http://localhost:9000/product-images/photo.jpg')
    expect(url).not.toContain('product-images/product-images')
  })

  it('retire le slash initial avant de construire l\'URL', () => {
    const url = assetUrl('/photo.jpg', 'product-images')
    expect(url).toBe('http://localhost:9000/product-images/photo.jpg')
  })

  it('fonctionne avec tous les buckets supportés', () => {
    expect(assetUrl('img.jpg', 'artist-images')).toContain('artist-images/img.jpg')
    expect(assetUrl('img.jpg', 'user-images')).toContain('user-images/img.jpg')
    expect(assetUrl('img.jpg', 'review-images')).toContain('review-images/img.jpg')
  })
})
