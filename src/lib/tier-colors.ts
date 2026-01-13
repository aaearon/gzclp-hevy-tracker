/**
 * Centralized color definitions for badges across the application.
 *
 * All badge colors are defined here for consistency and easy maintenance.
 */

import type { GZCLPDay, Stage, Tier } from '@/types/state'

export const TIER_COLORS: Record<Tier, string> = {
  T1: 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800',
  T2: 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  T3: 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800',
}

export const STAGE_COLORS: Record<Stage, string> = {
  0: 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300',
  1: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300',
  2: 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300',
}

export const DAY_COLORS: Record<GZCLPDay, string> = {
  A1: 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300',
  A2: 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300',
  B1: 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300',
  B2: 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300',
}
