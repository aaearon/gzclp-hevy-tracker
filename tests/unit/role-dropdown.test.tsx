/**
 * Unit Tests: RoleDropdown Component
 *
 * Tests for role selection dropdown functionality.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { RoleDropdown } from '@/components/common/RoleDropdown'
import type { ExerciseRole } from '@/types/state'

describe('RoleDropdown', () => {
  describe('rendering', () => {
    it('should render with placeholder by default', () => {
      render(<RoleDropdown value={undefined} onChange={() => {}} />)
      const dropdown = screen.getByRole('combobox', { name: 'Role' })
      expect(dropdown).toBeInTheDocument()
      expect(screen.getByText('Select role')).toBeInTheDocument()
    })

    it('should render all 7 roles', () => {
      render(<RoleDropdown value={undefined} onChange={() => {}} />)
      expect(screen.getByText('Squat')).toBeInTheDocument()
      expect(screen.getByText('Bench Press')).toBeInTheDocument()
      expect(screen.getByText('Overhead Press')).toBeInTheDocument()
      expect(screen.getByText('Deadlift')).toBeInTheDocument()
      expect(screen.getByText('T3 Accessory')).toBeInTheDocument()
      expect(screen.getByText('Warmup')).toBeInTheDocument()
      expect(screen.getByText('Cooldown')).toBeInTheDocument()
    })

    it('should show selected value', () => {
      render(<RoleDropdown value="squat" onChange={() => {}} />)
      const dropdown = screen.getByRole('combobox')
      expect(dropdown.value).toBe('squat')
    })

    it('should render with custom placeholder', () => {
      render(
        <RoleDropdown
          value={undefined}
          onChange={() => {}}
          placeholder="Choose a role"
        />
      )
      expect(screen.getByText('Choose a role')).toBeInTheDocument()
    })

    it('should hide placeholder when showPlaceholder is false', () => {
      render(
        <RoleDropdown
          value={undefined}
          onChange={() => {}}
          showPlaceholder={false}
        />
      )
      expect(screen.queryByText('Select role')).not.toBeInTheDocument()
    })
  })

  describe('interaction', () => {
    it('should call onChange when selection changes', () => {
      const handleChange = vi.fn()
      render(<RoleDropdown value={undefined} onChange={handleChange} />)

      const dropdown = screen.getByRole('combobox')
      fireEvent.change(dropdown, { target: { value: 'bench' } })

      expect(handleChange).toHaveBeenCalledWith('bench')
    })

    it('should not call onChange when empty value selected', () => {
      const handleChange = vi.fn()
      render(<RoleDropdown value="squat" onChange={handleChange} />)

      const dropdown = screen.getByRole('combobox')
      fireEvent.change(dropdown, { target: { value: '' } })

      expect(handleChange).not.toHaveBeenCalled()
    })
  })

  describe('disabled state', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<RoleDropdown value={undefined} onChange={() => {}} disabled />)
      const dropdown = screen.getByRole('combobox')
      expect(dropdown).toBeDisabled()
    })
  })

  describe('excludeRoles', () => {
    it('should disable excluded roles', () => {
      render(
        <RoleDropdown
          value={undefined}
          onChange={() => {}}
          excludeRoles={['squat', 'bench']}
        />
      )

      const squatOption = screen.getByRole('option', {
        name: /Squat.*already assigned/,
      })
      const benchOption = screen.getByRole('option', {
        name: /Bench Press.*already assigned/,
      })

      expect(squatOption.disabled).toBe(true)
      expect(benchOption.disabled).toBe(true)
    })

    it('should not disable non-excluded roles', () => {
      render(
        <RoleDropdown
          value={undefined}
          onChange={() => {}}
          excludeRoles={['squat']}
        />
      )

      const ohpOption = screen.getByRole('option', {
        name: 'Overhead Press',
      })
      const t3Option = screen.getByRole('option', {
        name: 'T3 Accessory',
      })

      expect(ohpOption.disabled).toBe(false)
      expect(t3Option.disabled).toBe(false)
    })

    it('should allow current value even if excluded', () => {
      render(
        <RoleDropdown
          value="squat"
          onChange={() => {}}
          excludeRoles={['squat', 'bench']}
        />
      )

      // The squat option should NOT be disabled since it's the current value
      const squatOption = screen.getByRole('option', {
        name: 'Squat',
      })
      expect(squatOption.disabled).toBe(false)
    })
  })

  describe('accessibility', () => {
    it('should have correct aria-label', () => {
      render(
        <RoleDropdown
          value={undefined}
          onChange={() => {}}
          ariaLabel="Exercise role"
        />
      )
      expect(
        screen.getByRole('combobox', { name: 'Exercise role' })
      ).toBeInTheDocument()
    })

    it('should associate with id for label', () => {
      render(
        <RoleDropdown value={undefined} onChange={() => {}} id="role-select" />
      )
      const dropdown = screen.getByRole('combobox')
      expect(dropdown).toHaveAttribute('id', 'role-select')
    })
  })
})
