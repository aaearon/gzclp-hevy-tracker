/**
 * WeightDisplay Component Tests
 *
 * Tests for the reusable weight display component.
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { WeightDisplay } from '@/components/common/WeightDisplay'

describe('WeightDisplay', () => {
  describe('unit display', () => {
    it('displays weight in kg when unit is kg', () => {
      render(<WeightDisplay weight={100} unit="kg" />)

      expect(screen.getByText('100 kg')).toBeInTheDocument()
    })

    it('displays weight in lbs when unit is lbs (converted from kg)', () => {
      // 100 kg = 220.462 lbs, rounded to nearest 5 = 220 lbs
      render(<WeightDisplay weight={100} unit="lbs" />)

      expect(screen.getByText('220 lbs')).toBeInTheDocument()
    })

    it('handles decimal kg values', () => {
      render(<WeightDisplay weight={62.5} unit="kg" />)

      expect(screen.getByText('62.5 kg')).toBeInTheDocument()
    })

    it('converts small weights correctly', () => {
      // 20 kg = 44.09 lbs, rounded to nearest 5 = 45 lbs
      render(<WeightDisplay weight={20} unit="lbs" />)

      expect(screen.getByText('45 lbs')).toBeInTheDocument()
    })
  })

  describe('size variants', () => {
    it('uses md size by default', () => {
      render(<WeightDisplay weight={100} unit="kg" />)

      const span = screen.getByText('100 kg')
      expect(span).toHaveClass('text-xl')
      expect(span).toHaveClass('font-bold')
    })

    it('applies sm size styling', () => {
      render(<WeightDisplay weight={100} unit="kg" size="sm" />)

      const span = screen.getByText('100 kg')
      expect(span).toHaveClass('text-sm')
      expect(span).toHaveClass('font-medium')
    })

    it('applies md size styling', () => {
      render(<WeightDisplay weight={100} unit="kg" size="md" />)

      const span = screen.getByText('100 kg')
      expect(span).toHaveClass('text-xl')
      expect(span).toHaveClass('font-bold')
    })

    it('applies lg size styling', () => {
      render(<WeightDisplay weight={100} unit="kg" size="lg" />)

      const span = screen.getByText('100 kg')
      expect(span).toHaveClass('text-2xl')
      expect(span).toHaveClass('font-bold')
    })
  })

  describe('colorClass override', () => {
    it('uses default color class when not overridden', () => {
      render(<WeightDisplay weight={100} unit="kg" />)

      const span = screen.getByText('100 kg')
      expect(span).toHaveClass('text-gray-900')
    })

    it('applies custom color class when provided', () => {
      render(
        <WeightDisplay
          weight={100}
          unit="kg"
          colorClass="text-red-700 dark:text-red-400"
        />
      )

      const span = screen.getByText('100 kg')
      expect(span).toHaveClass('text-red-700')
      expect(span).not.toHaveClass('text-gray-900')
    })

    it('applies tier-specific colors correctly', () => {
      render(
        <WeightDisplay
          weight={100}
          unit="kg"
          colorClass="text-blue-700 dark:text-blue-400"
        />
      )

      const span = screen.getByText('100 kg')
      expect(span).toHaveClass('text-blue-700')
    })
  })

  describe('showUnit prop', () => {
    it('shows unit suffix by default', () => {
      render(<WeightDisplay weight={100} unit="kg" />)

      expect(screen.getByText('100 kg')).toBeInTheDocument()
    })

    it('hides unit suffix when showUnit is false', () => {
      render(<WeightDisplay weight={100} unit="kg" showUnit={false} />)

      expect(screen.getByText('100')).toBeInTheDocument()
      expect(screen.queryByText('100 kg')).not.toBeInTheDocument()
    })

    it('shows converted value without unit when showUnit is false', () => {
      // 100 kg = 220 lbs
      render(<WeightDisplay weight={100} unit="lbs" showUnit={false} />)

      expect(screen.getByText('220')).toBeInTheDocument()
      expect(screen.queryByText('220 lbs')).not.toBeInTheDocument()
    })
  })

  describe('edge cases', () => {
    it('handles zero weight', () => {
      render(<WeightDisplay weight={0} unit="kg" />)

      expect(screen.getByText('0 kg')).toBeInTheDocument()
    })

    it('handles very large weights', () => {
      render(<WeightDisplay weight={500} unit="kg" />)

      expect(screen.getByText('500 kg')).toBeInTheDocument()
    })

    it('handles very small weights', () => {
      render(<WeightDisplay weight={2.5} unit="kg" />)

      expect(screen.getByText('2.5 kg')).toBeInTheDocument()
    })

    it('combines size and color props correctly', () => {
      render(
        <WeightDisplay
          weight={100}
          unit="kg"
          size="lg"
          colorClass="text-green-700 dark:text-green-300"
        />
      )

      const span = screen.getByText('100 kg')
      expect(span).toHaveClass('text-2xl')
      expect(span).toHaveClass('font-bold')
      expect(span).toHaveClass('text-green-700')
    })
  })
})
