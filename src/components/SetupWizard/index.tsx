/**
 * SetupWizard Component
 *
 * Multi-step wizard for initial GZCLP program configuration.
 */

import { useState, useEffect, useCallback } from 'react'
import { ApiKeyStep } from './ApiKeyStep'
import { RoutineSourceStep } from './RoutineSourceStep'
import { RoutineAssignmentStep } from './RoutineAssignmentStep'
import { ImportReviewStep } from './ImportReviewStep'
import { NextWorkoutStep } from './NextWorkoutStep'
import { SlotAssignmentStep } from './SlotAssignment'
import { WeightSetupStep } from './WeightSetupStep'
import { SetupComplete } from './SetupComplete'
import { useHevyApi } from '@/hooks/useHevyApi'
import { useProgram } from '@/hooks/useProgram'
import { useRoutineImport } from '@/hooks/useRoutineImport'
import { ALL_SLOTS, SLOT_DEFAULT_MUSCLE_GROUP } from '@/lib/constants'
import type { GZCLPSlot, GZCLPDay, WeightUnit, Tier, RoutineSourceMode, ImportedExercise } from '@/types/state'

type SetupStep =
  | 'api-key'
  | 'routine-source'
  | 'routine-assign'
  | 'import-review'
  | 'next-workout'
  | 'exercises'
  | 'weights'
  | 'complete'

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
  const [routineSourceMode, setRoutineSourceMode] = useState<RoutineSourceMode | null>(null)
  const [assignments, setAssignments] = useState<Record<GZCLPSlot, string | null>>(() => {
    const initial: Record<string, string | null> = {}
    for (const slot of ALL_SLOTS) {
      initial[slot] = null
    }
    return initial as Record<GZCLPSlot, string | null>
  })
  const [weights, setWeights] = useState<Record<string, number>>({})
  const [unit, setUnit] = useState<WeightUnit>('kg')
  const [selectedDay, setSelectedDay] = useState<GZCLPDay>('A1')

  const hevy = useHevyApi()
  const program = useProgram()
  const routineImport = useRoutineImport(hevy.routines)

  // Load routines when entering routine-source step
  useEffect(() => {
    if (currentStep === 'routine-source' && hevy.isConnected && hevy.routines.length === 0 && !hevy.isLoadingRoutines) {
      void hevy.loadRoutines()
    }
  }, [currentStep, hevy.isConnected, hevy.routines.length, hevy.isLoadingRoutines, hevy.loadRoutines])

  // Load exercises when entering exercises step (create path)
  useEffect(() => {
    if (currentStep === 'exercises' && hevy.isConnected && hevy.exerciseTemplates.length === 0) {
      void hevy.loadExerciseTemplates()
    }
  }, [currentStep, hevy.isConnected, hevy.exerciseTemplates.length, hevy.loadExerciseTemplates])

  const handleApiConnect = useCallback(
    async (apiKey: string): Promise<boolean> => {
      const success = await hevy.connect(apiKey)
      if (success) {
        program.setApiKey(apiKey)
        setCurrentStep('routine-source')
      }
      return success
    },
    [hevy, program]
  )

  const handleRoutineSourceSelect = useCallback((mode: RoutineSourceMode) => {
    setRoutineSourceMode(mode)
    if (mode === 'create') {
      setCurrentStep('exercises')
    } else {
      // Import path - go to routine assignment
      setCurrentStep('routine-assign')
    }
  }, [])

  const handleRoutineAssign = useCallback(
    (day: GZCLPDay, routineId: string | null) => {
      routineImport.setAssignment(day, routineId)
    },
    [routineImport]
  )

  const handleRoutineAssignNext = useCallback(() => {
    // Trigger extraction from assigned routines and go to import-review
    routineImport.extract(hevy.routines)
    setCurrentStep('import-review')
  }, [routineImport, hevy.routines])

  const handleImportReviewUpdate = useCallback(
    (index: number, updates: Partial<ImportedExercise>) => {
      routineImport.updateExercise(index, updates)
    },
    [routineImport]
  )

  const handleImportReviewNext = useCallback(() => {
    // Go to next-workout step
    setCurrentStep('next-workout')
  }, [])

  const handleImportReviewBack = useCallback(() => {
    setCurrentStep('routine-assign')
  }, [])

  const handleDaySelect = useCallback((day: GZCLPDay) => {
    setSelectedDay(day)
  }, [])

  const handleNextWorkoutComplete = useCallback(() => {
    if (routineSourceMode === 'import' && routineImport.importResult) {
      // Import path: save imported exercises
      const { exercises: importedExercises } = routineImport.importResult

      for (const imported of importedExercises) {
        const confirmedSlot = imported.userSlot ?? imported.slot
        const confirmedWeight = imported.userWeight ?? imported.detectedWeight
        const confirmedStage = imported.userStage ?? imported.detectedStage

        // Add exercise to program
        const exerciseId = program.addExercise({
          hevyTemplateId: imported.templateId,
          name: imported.name,
          tier: getTierFromSlot(confirmedSlot),
          slot: confirmedSlot,
          muscleGroup: SLOT_DEFAULT_MUSCLE_GROUP[confirmedSlot],
        })

        // Set initial weight and stage
        program.setInitialWeight(exerciseId, confirmedWeight, confirmedStage)
      }

      // Save routine IDs to program
      program.setRoutineIds(routineImport.assignment)
    }

    // Set current day and complete
    program.setCurrentDay(selectedDay)
    setCurrentStep('complete')
  }, [routineSourceMode, routineImport.importResult, routineImport.assignment, selectedDay, program])

  const handleNextWorkoutBack = useCallback(() => {
    // Go back to import-review if import path, or weights if create path
    setCurrentStep(routineSourceMode === 'import' ? 'import-review' : 'weights')
  }, [routineSourceMode])

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

  const handleWeightsNext = useCallback(() => {
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

    // Go to next-workout step
    setCurrentStep('next-workout')
  }, [assignments, weights, hevy.exerciseTemplates, program])

  const assignedCount = Object.values(assignments).filter((id) => id !== null).length

  const handleBack = useCallback(() => {
    switch (currentStep) {
      case 'routine-source':
        setCurrentStep('api-key')
        break
      case 'routine-assign':
        setCurrentStep('routine-source')
        break
      case 'import-review':
        setCurrentStep('routine-assign')
        break
      case 'next-workout':
        // Go back to import-review if import path, or weights if create path
        setCurrentStep(routineSourceMode === 'import' ? 'import-review' : 'weights')
        break
      case 'exercises':
        // Go back to routine-source if we came from create, or routine-assign if import
        setCurrentStep(routineSourceMode === 'import' ? 'routine-assign' : 'routine-source')
        break
      case 'weights':
        setCurrentStep('exercises')
        break
      default:
        break
    }
  }, [currentStep, routineSourceMode])

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress indicator - dynamic based on path */}
        {(() => {
          // Create path shows: Connect → Source → Exercises → Weights → Next → Done
          // Import path shows: Connect → Source → Assign → Review → Next → Done
          const createSteps: SetupStep[] = ['api-key', 'routine-source', 'exercises', 'weights', 'next-workout', 'complete']
          const importSteps: SetupStep[] = ['api-key', 'routine-source', 'routine-assign', 'import-review', 'next-workout', 'complete']
          const createLabels = ['Connect', 'Source', 'Exercises', 'Weights', 'Next', 'Done']
          const importLabels = ['Connect', 'Source', 'Assign', 'Review', 'Next', 'Done']

          const steps = routineSourceMode === 'import' ? importSteps : createSteps
          const labels = routineSourceMode === 'import' ? importLabels : createLabels

          return (
            <div className="mb-8">
              <div className="flex items-center justify-center space-x-4">
                {steps.map((step, index) => (
                  <div key={step} className="flex items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                                 ${
                                   currentStep === step
                                     ? 'bg-blue-600 text-white'
                                     : index < steps.indexOf(currentStep)
                                       ? 'bg-green-500 text-white'
                                       : 'bg-gray-200 text-gray-600'
                                 }`}
                    >
                      {index + 1}
                    </div>
                    {index < steps.length - 1 && <div className="w-8 h-0.5 bg-gray-200 mx-1" />}
                  </div>
                ))}
              </div>
              <div className="flex justify-center mt-2 text-xs text-gray-500">
                {labels.map((label) => (
                  <span key={label} className="w-16 text-center">
                    {label}
                  </span>
                ))}
              </div>
            </div>
          )
        })()}

        {/* Step content */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          {currentStep === 'api-key' && (
            <ApiKeyStep
              onConnect={handleApiConnect}
              isConnecting={hevy.isConnecting}
              connectionError={hevy.connectionError}
            />
          )}

          {currentStep === 'routine-source' && (
            <RoutineSourceStep
              hasRoutines={hevy.routines.length > 0}
              isLoading={hevy.isLoadingRoutines}
              onSelect={handleRoutineSourceSelect}
            />
          )}

          {currentStep === 'routine-assign' && (
            <RoutineAssignmentStep
              routines={routineImport.availableRoutines}
              assignment={routineImport.assignment}
              onAssign={handleRoutineAssign}
              onNext={handleRoutineAssignNext}
              onBack={handleBack}
            />
          )}

          {currentStep === 'import-review' && routineImport.importResult && (
            <ImportReviewStep
              importResult={routineImport.importResult}
              onExerciseUpdate={handleImportReviewUpdate}
              onNext={handleImportReviewNext}
              onBack={handleImportReviewBack}
            />
          )}

          {currentStep === 'next-workout' && (
            <NextWorkoutStep
              selectedDay={selectedDay}
              onDaySelect={handleDaySelect}
              onNext={handleNextWorkoutComplete}
              onBack={handleNextWorkoutBack}
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
        {currentStep !== 'api-key' &&
          currentStep !== 'routine-source' &&
          currentStep !== 'routine-assign' &&
          currentStep !== 'import-review' &&
          currentStep !== 'next-workout' &&
          currentStep !== 'complete' && (
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
                onClick={handleWeightsNext}
                className="px-6 py-2 bg-blue-600 text-white rounded-md font-medium
                           hover:bg-blue-700 min-h-[44px]"
              >
                Next
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
