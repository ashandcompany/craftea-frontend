import { describe, it, expect } from 'vitest'
import {
  orderConfirmationTemplate,
  stripeKycInviteTemplate,
  stripeKycConfirmedTemplate,
  payoutSentTemplate,
  payoutFailedTemplate,
  resetPasswordTemplate,
} from './email-templates'

describe('orderConfirmationTemplate', () => {
  const base = {
    orderNumber: 'CMD-2024-001',
    items: [
      { name: 'Vase en céramique', qty: 2, unitPrice: 4999 },
      { name: 'Bol artisanal', qty: 1, unitPrice: 2500 },
    ],
    total: 12498,
    commissionAmount: 875,
    orderUrl: 'https://craftea.fr/orders/42',
  }

  it('retourne une chaîne HTML', () => {
    expect(typeof orderConfirmationTemplate(base)).toBe('string')
    expect(orderConfirmationTemplate(base)).toContain('<!DOCTYPE html>')
  })

  it('contient le numéro de commande', () => {
    expect(orderConfirmationTemplate(base)).toContain('CMD-2024-001')
  })

  it('affiche les noms des articles', () => {
    const html = orderConfirmationTemplate(base)
    expect(html).toContain('Vase en céramique')
    expect(html).toContain('Bol artisanal')
  })

  it('affiche les prix en euros (centimes ÷ 100)', () => {
    const html = orderConfirmationTemplate(base)
    expect(html).toContain('49.99')
    expect(html).toContain('25.00')
    expect(html).toContain('124.98') // total
    expect(html).toContain('8.75')   // commission
  })

  it('contient le lien vers la commande', () => {
    expect(orderConfirmationTemplate(base)).toContain('https://craftea.fr/orders/42')
  })

  it('gère un seul article', () => {
    const single = { ...base, items: [{ name: 'Unique', qty: 1, unitPrice: 1000 }] }
    expect(orderConfirmationTemplate(single)).toContain('Unique')
  })
})

describe('stripeKycInviteTemplate', () => {
  const base = {
    artistName: 'Marie Dupont',
    onboardingUrl: 'https://connect.stripe.com/onboard/abc123',
  }

  it('retourne une chaîne HTML', () => {
    expect(typeof stripeKycInviteTemplate(base)).toBe('string')
    expect(stripeKycInviteTemplate(base)).toContain('<!DOCTYPE html>')
  })

  it('contient le nom de l\'artiste', () => {
    expect(stripeKycInviteTemplate(base)).toContain('Marie Dupont')
  })

  it('contient le lien d\'onboarding', () => {
    expect(stripeKycInviteTemplate(base)).toContain('https://connect.stripe.com/onboard/abc123')
  })
})

describe('stripeKycConfirmedTemplate', () => {
  it('retourne une chaîne HTML', () => {
    const html = stripeKycConfirmedTemplate({ artistName: 'Jean Martin' })
    expect(typeof html).toBe('string')
    expect(html).toContain('<!DOCTYPE html>')
  })

  it('contient le nom de l\'artiste', () => {
    expect(stripeKycConfirmedTemplate({ artistName: 'Jean Martin' })).toContain('Jean Martin')
  })

  it('mentionne la vérification réussie', () => {
    const html = stripeKycConfirmedTemplate({ artistName: 'Jean' })
    expect(html).toContain('vérifiée avec succès')
  })
})

describe('payoutSentTemplate', () => {
  it('retourne une chaîne HTML', () => {
    const html = payoutSentTemplate({ amount: 5000, currency: 'eur', estimatedDays: 2 })
    expect(typeof html).toBe('string')
    expect(html).toContain('<!DOCTYPE html>')
  })

  it('affiche le montant formaté en euros (centimes ÷ 100)', () => {
    const html = payoutSentTemplate({ amount: 5000, currency: 'eur', estimatedDays: 2 })
    expect(html).toContain('50.00')
  })

  it('affiche la devise en majuscules', () => {
    const html = payoutSentTemplate({ amount: 1000, currency: 'eur', estimatedDays: 1 })
    expect(html).toContain('EUR')
  })

  it('pluralise correctement pour 1 jour', () => {
    const html = payoutSentTemplate({ amount: 1000, currency: 'eur', estimatedDays: 1 })
    expect(html).toContain('1 jour ouvré')
    expect(html).not.toContain('1 jours')
  })

  it('pluralise correctement pour plusieurs jours', () => {
    const html = payoutSentTemplate({ amount: 1000, currency: 'eur', estimatedDays: 3 })
    expect(html).toContain('3 jours ouvrés')
  })
})

describe('payoutFailedTemplate', () => {
  it('retourne une chaîne HTML', () => {
    const html = payoutFailedTemplate({ amount: 7500, currency: 'eur' })
    expect(typeof html).toBe('string')
    expect(html).toContain('<!DOCTYPE html>')
  })

  it('affiche le montant formaté', () => {
    const html = payoutFailedTemplate({ amount: 7500, currency: 'eur' })
    expect(html).toContain('75.00')
  })

  it('affiche la devise en majuscules', () => {
    const html = payoutFailedTemplate({ amount: 1000, currency: 'eur' })
    expect(html).toContain('EUR')
  })

  it('mentionne l\'échec du virement', () => {
    const html = payoutFailedTemplate({ amount: 1000, currency: 'eur' })
    expect(html).toContain('Échec du virement')
  })
})

describe('resetPasswordTemplate', () => {
  it('retourne une chaîne HTML', () => {
    const html = resetPasswordTemplate({ resetUrl: 'https://craftea.fr/reset?token=abc' })
    expect(typeof html).toBe('string')
    expect(html).toContain('<!DOCTYPE html>')
  })

  it('contient le lien de réinitialisation', () => {
    const url = 'https://craftea.fr/reset?token=xyz789'
    const html = resetPasswordTemplate({ resetUrl: url })
    expect(html).toContain(url)
  })

  it('mentionne la durée de validité du lien', () => {
    const html = resetPasswordTemplate({ resetUrl: 'https://craftea.fr/reset' })
    expect(html).toContain('30 minutes')
  })
})
