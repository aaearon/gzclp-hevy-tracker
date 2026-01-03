/**
 * SetupWizard Component
 *
 * Multi-step wizard for initial GZCLP program configuration.
 */

import { useState, useEffect, useCallback } from 'react'
import { ApiKeyStep } from './ApiKeyStep'
import { SlotAssignmentStep } from './SlotAssignment'
import { WeightSetupStep } from './WeightSetupStep'
import { SetupComplete } from './SetupComplete'
import { useHevyApi } from '@/hooks/useHevyApi'
import { useProgram } from '@/hooks/useProgram'
import { ALL_SLOTS, SLOT_DEFAULT_MUSCLE_GROUP } from '@/lib/constants'
import type { GZCLPSlot, WeightUnit, Tier } from '@/types/state'

type SetupStep = 'api-key' | 'exercises' | 'weights' | 'complete'

export interface SetupWizardProps {
  onComplete: () => void
}

function getTierFromSlot(slot: GZCLPSlot): Tier {
  if (slot.startsWith('t1_')) return 'T1'
  if (slot.startsWith('t2_')) return 'T2'
  return 'T3'
}

export function SetupWizard({ onComplete }: SetupWizardProps) {
  const [currentStep, setCurrentStep] = useState<SetupStep>('api-key')
  const [assignments, setAssignments] = useState<Record<GZCLPSlot, string | null>>(() => {
    const initial: Record<string, string | null> = {}
    for (const slot of ALL_SLOTS) {
      initial[slot] = null
    }
    return initial as Record<GZCLPSlot, string | null>
  })
  const [weights, setWeights] = useState<Record<string, number>>({})
  const [unit, setUnit] = useState<WeightUnit>('kg')

  const hevy = useHevyApi()
  const program = useProgram()

  // Load exercises when connected
  useEffect(() => {
    if (hevy.isConnected && hevy.exerciseTemplates.length === 0) {
      void hevy.loadExerciseTemplates()
    }
  }, [hevy.isConnected, hevy.exerciseTemplates.length, hevy.loadExerciseTemplates])

  const handleApiConnect = useCallback(
    async (apiKey: string): Promise<boolean> => {
      const success = await hevy.connect(apiKey)
      if (success) {
        program.setApiKey(apiKey)
        setCurrentStep('exercises')
      }
      return success
    },
    [hevy, program]
  )

  const handleAssignment = useCallback((slot: GZCLPSlot, templateId: string | null) => {
    setAssignments((prev) => ({
      ...prev,
      [slot]: templateId,
    }))
  }, [])

  const handleWeightChange = useCallback((slot: GZCLPSlot, weight: number) => {
    setWeights((prev) => ({
      ...prev,
      [slot]: weight,
    }))
  }, [])

  const handleUnitChange = useCallback(
    (newUnit: WeightUnit) => {
      setUnit(newUnit)
      program.setWeightUnit(newUnit)
    },
    [program]
  )

  const handleExercisesNext = useCallback(() => {
    // Check if at least one exercise is assigned
    const hasAssignments = Object.values(assignments).some((id) => id !== null)
    if (!hasAssignments) {
      return
    }
    setCurrentStep('weights')
  }, [assignments])

  const handleWeightsComplete = useCallback(() => {
    // Save all exercises and weights to program state
    for (const [slot, templateId] of Object.entries(assignments)) {
      if (!templateId) continue

      const exercise = hevy.exerciseTemplates.find((ex) => ex.id === templateId)
      if (!exercise) continue

      const gzclpSlot = slot as GZCLPSlot

      // Add exercise to program
      const exerciseId = program.addExercise({
        hevyTemplateId: templateId,
        name: exercise.title,
        tier: getTierFromSlot(gzclpSlot),
        slot: gzclpSlot,
        muscleGroup: SLOT_DEFAULT_MUSCLE_GROUP[gzclpSlot],
      })

      // Set initial weight
      const weight = weights[slot] ?? 0
      program.setInitialWeight(exerciseId, weight)
    }

    setCurrentStep('complete')
  }, [assignments, weights, hevy.exerciseTemplates, program])

  const assignedCount = Object.values(assignments).filter((id) => id !== null).length

  const handleBack = useCallback(() => {
    switch (currentStep) {
      case 'exercises':
        setCurrentStep('api-key')
        break
      case 'weights':
        setCurrentStep('exercises')
        break
      default:
        break
    }
  }, [currentStep])

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {(['api-key', 'exercises', 'weights', 'complete'] as SetupStep[]).map((step, index) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                             ${
                               currentStep === step
                                 ? 'bg-blue-600 text-white'
                                 : index <
                                     ['api-key', 'exercises', 'weights', 'complete'].indexOf(
                                       currentStep
                                     )
                                   ? 'bg-green-500 text-white'
                                   : 'bg-gray-200 text-gray-600'
                             }`}
                >
                  {index + 1}
                </div>
                {index < 3 && <div className="w-8 h-0.5 bg-gray-200 mx-1" />}
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-2 text-xs text-gray-500">
            <span className="w-16 text-center">Connect</span>
            <span className="w-16 text-center">Exercises</span>
            <span className="w-16 text-center">Weights</span>
            <span className="w-16 text-center">Done</span>
          </div>
        </div>

        {/* Step content */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          {currentStep === 'api-key' && (
            <ApiKeyStep
              onConnect={handleApiConnect}
              isConnecting={hevy.isConnecting}
              connectionError={hevy.connectionError}
            />
          )}

          {currentStep === 'exercises' && (
            <SlotAssignmentStep
              exercises={hevy.exerciseTemplates}
              assignments={assignments}
              onAssign={handleAssignment}
              isLoading={hevy.isLoadingTemplates}
            />
          )}

          {currentStep === 'weights' && (
            <WeightSetupStep
              assignments={assignments}
              exercises={hevy.exerciseTemplates}
              weights={weights}
              onWeightChange={handleWeightChange}
              unit={unit}
              onUnitChange={handleUnitChange}
            />
          )}

          {currentStep === 'complete' && (
            <SetupComplete onContinue={onComplete} exerciseCount={assignedCount} />
          )}
        </div>

        {/* Navigation buttons */}
        {currentStep !== 'api-key' && currentStep !== 'complete' && (
          <div className="flex justify-between">
            <button
              type="button"
              onClick={handleBack}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 min-h-[44px]"
            >
              Back
            </button>

            {currentStep === 'exercises' && (
              <button
                type="button"
                onClick={handleExercisesNext}
                disabled={assignedCount === 0}
                className="px-6 py-2 bg-blue-600 text-white rounded-md font-medium
                           hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed
                           min-h-[44px]"
              >
                Next ({assignedCount} selected)
              </button>
            )}

            {currentStep === 'weights' && (
              <button
                type="button"
                onClick={handleWeightsComplete}
                className="px-6 py-2 bg-blue-600 text-white rounded-md font-medium
                           hover:bg-blue-700 min-h-[44px]"
              >
                Complete Setup
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
