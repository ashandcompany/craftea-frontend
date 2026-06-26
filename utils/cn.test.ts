import { describe, it, expect } from 'vitest'
import { cn } from './cn'

describe('cn', () => {
  it('merges plusieurs classes', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('ignore les valeurs falsy', () => {
    expect(cn('foo', undefined, false as never, null as never, 'bar')).toBe('foo bar')
  })

  it('résout les conflits tailwind (dernière valeur gagne)', () => {
    expect(cn('p-4', 'p-8')).toBe('p-8')
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
    expect(cn('mt-2', 'mt-4')).toBe('mt-4')
  })

  it('retourne une chaîne vide sans argument', () => {
    expect(cn()).toBe('')
  })

  it('gère les tableaux de classes', () => {
    expect(cn(['foo', 'bar'], 'baz')).toBe('foo bar baz')
  })

  it('gère les objets conditionnels', () => {
    expect(cn({ 'font-bold': true, italic: false })).toBe('font-bold')
  })
})
