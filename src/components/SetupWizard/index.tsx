/**
 * SetupWizard Component
 *
 * Multi-step wizard for initial GZCLP program configuration.
 */

import { useState, useEffect, useCallback } from 'react'
import { WelcomeStep } from './WelcomeStep'
import { RoutineAssignmentStep } from './RoutineAssignmentStep'
import { ImportReviewStep } from './ImportReviewStep'
import { NextWorkoutStep } from './NextWorkoutStep'
import { SlotAssignmentStep, type CreatePathAssignments } from './SlotAssignment'
import { WeightSetupStep } from './WeightSetupStep'
import { SetupComplete } from './SetupComplete'
import { useHevyApi } from '@/hooks/useHevyApi'
import { useProgram } from '@/hooks/useProgram'
import { useRoutineImport } from '@/hooks/useRoutineImport'
import { MAIN_LIFT_ROLES, type MainLiftRole } from '@/types/state'
import type { GZCLPDay, WeightUnit, RoutineSourceMode, ImportedExercise, GZCLPState } from '@/types/state'
import { calculateCreatedAtFromWorkouts } from '@/lib/weeks-calculator'
import { importProgressionHistory } from '@/lib/history-importer'
import { createHevyClient } from '@/lib/hevy-client'
import { buildImportProgramState, buildCreateProgramState } from '@/lib/program-builder'

type SetupStep =
  | 'welcome'
  | 'routine-assign'
  | 'import-review'
  | 'next-workout'
  | 'exercises'
  | 'weights'
  | 'complete'

export interface SetupWizardProps {
  onComplete: () => void
}

const initialAssignments: CreatePathAssignments = {
  mainLifts: { squat: null, bench: null, ohp: null, deadlift: null },
  t3Exercises: { A1: [], B1: [], A2: [], B2: [] },  // Phase 9: per-day T3s
}

export function SetupWizard({ onComplete }: SetupWizardProps) {
  const [currentStep, setCurrentStep] = useState<SetupStep>('welcome')
  const [routineSourceMode, setRoutineSourceMode] = useState<RoutineSourceMode | null>(null)
  const [assignments, setAssignments] = useState<CreatePathAssignments>(initialAssignments)
  const [weights, setWeights] = useState<Record<string, number>>({})
  const [unit, setUnit] = useState<WeightUnit>('kg')
  const [selectedDay, setSelectedDay] = useState<GZCLPDay>('A1')

  const hevy = useHevyApi()
  const program = useProgram()
  const routineImport = useRoutineImport(hevy.routines)

  // Load routines immediately after API connection (for WelcomeStep path selection)
  useEffect(() => {
    if (currentStep === 'welcome' && hevy.isConnected && hevy.routines.length === 0 && !hevy.isLoadingRoutines) {
      void hevy.loadRoutines()
    }
  }, [currentStep, hevy.isConnected, hevy.routines.length, hevy.isLoadingRoutines, hevy.loadRoutines])

  // Load exercises when entering exercises step (create path)
  useEffect(() => {
    if (currentStep === 'exercises' && hevy.isConnected && hevy.exerciseTemplates.length === 0) {
      void hevy.loadExerciseTemplates()
    }
  }, [currentStep, hevy.isConnected, hevy.exerciseTemplates.length, hevy.loadExerciseTemplates])

  // API key validation for WelcomeStep (does not navigate away)
  const handleValidateApiKey = useCallback(
    async (apiKey: string): Promise<boolean> => {
      const success = await hevy.connect(apiKey)
      if (success) {
        program.setApiKey(apiKey)
      }
      return success
    },
    [hevy, program]
  )

  // Combined handler for WelcomeStep completion
  const handleWelcomeComplete = useCallback((data: {
    apiKey: string
    path: RoutineSourceMode
    unit: WeightUnit
    workoutsPerWeek: number
    restoredState?: GZCLPState
  }) => {
    setRoutineSourceMode(data.path)
    program.setWeightUnit(data.unit)
    program.setWorkoutsPerWeek(data.workoutsPerWeek)
    setUnit(data.unit)

    if (data.path === 'restore' && data.restoredState) {
      // Restore path - merge new API key with restored state and complete setup
      const mergedState: GZCLPState = {
        ...data.restoredState,
        apiKey: data.apiKey, // Use the newly validated API key
      }
      program.importState(mergedState)
      // CompletedGuard will handle navigation when isSetupRequired becomes false
      return
    }

    if (data.path === 'create') {
      setCurrentStep('exercises')
    } else {
      // Import path - go to routine assignment
      setCurrentStep('routine-assign')
    }
  }, [program])

  const handleRoutineAssign = useCallback(
    (day: GZCLPDay, routineId: string | null) => {
      routineImport.setAssignment(day, routineId)
    },
    [routineImport]
  )

  const handleRoutineAssignNext = useCallback(async () => {
    // Trigger extraction from assigned routines with workout history
    await routineImport.extract(hevy.routines, () => hevy.getAllWorkouts(), unit)
    setCurrentStep('import-review')
  }, [routineImport, hevy.routines, hevy, unit])

  const handleDayExerciseUpdate = useCallback(
    (day: GZCLPDay, position: 'T1' | 'T2', updates: Partial<ImportedExercise>) => {
      routineImport.updateDayExercise(day, position, updates)
    },
    [routineImport]
  )

  const handleDayT3Remove = useCallback(
    (day: GZCLPDay, index: number) => {
      routineImport.removeDayT3(day, index)
    },
    [routineImport]
  )

  const handleMainLiftWeightsUpdate = useCallback(
    (role: MainLiftRole, updates: { t1Weight: number; t2Weight: number }) => {
      routineImport.updateMainLiftWeights(role, updates)
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

  const handleNextWorkoutComplete = useCallback(async () => {
    if (routineSourceMode === 'import' && routineImport.importResult) {
      try {
        // Fetch async data for import
        const allWorkouts = await hevy.getAllWorkouts()
        const weeksResult = calculateCreatedAtFromWorkouts(
          allWorkouts,
          routineImport.assignment,
          { workoutsPerWeek: program.state.program.workoutsPerWeek }
        )

        // Import progression history for charts
        let progressionHistory = {}
        try {
          const client = createHevyClient(program.state.apiKey)
          const historyResult = await importProgressionHistory(
            client,
            {}, // Empty exercises - will be populated by buildImportProgramState
            routineImport.assignment
          )
          progressionHistory = historyResult.history
        } catch {
          // Continue without history - charts will be empty initially
        }

        // Build complete state using pure function
        const state = buildImportProgramState({
          importResult: routineImport.importResult,
          selectedDay,
          apiKey: program.state.apiKey,
          unit,
          workoutsPerWeek: program.state.program.workoutsPerWeek,
          workoutStats: {
            createdAt: weeksResult.calculatedCreatedAt,
          },
          progressionHistory,
        })

        // Atomic import via React state - no localStorage writes, no reload needed
        // CompletedGuard will handle navigation when isSetupRequired becomes false
        program.importState(state)
        return
      } catch {
        // Fall through to fallback
      }
    }

    // Create path: Build complete state and import atomically
    if (routineSourceMode === 'create') {
      const state = buildCreateProgramState({
        assignments,
        weights,
        exerciseTemplates: hevy.exerciseTemplates,
        selectedDay,
        apiKey: program.state.apiKey,
        unit,
        workoutsPerWeek: program.state.program.workoutsPerWeek,
      })

      // Atomic import - CompletedGuard handles navigation
      program.importState(state)
      return
    }

    // Fallback: Set current day and show complete step
    program.setCurrentDay(selectedDay)
    setCurrentStep('complete')
  }, [routineSourceMode, routineImport, selectedDay, program, hevy, unit, assignments, weights])

  const handleNextWorkoutBack = useCallback(() => {
    // Go back to import-review if import path, or weights if create path
    setCurrentStep(routineSourceMode === 'import' ? 'import-review' : 'weights')
  }, [routineSourceMode])

  const handleMainLiftAssign = useCallback((role: MainLiftRole, templateId: string | null) => {
    setAssignments((prev) => ({
      ...prev,
      mainLifts: { ...prev.mainLifts, [role]: templateId },
    }))
  }, [])

  // Phase 9: Day-aware T3 callbacks
  const handleT3Add = useCallback((day: GZCLPDay, templateId: string) => {
    setAssignments((prev) => ({
      ...prev,
      t3Exercises: {
        ...prev.t3Exercises,
        [day]: [...prev.t3Exercises[day], templateId],
      },
    }))
  }, [])

  const handleT3Remove = useCallback((day: GZCLPDay, index: number) => {
    setAssignments((prev) => ({
      ...prev,
      t3Exercises: {
        ...prev.t3Exercises,
        [day]: prev.t3Exercises[day].filter((_, i) => i !== index),
      },
    }))
  }, [])

  const handleT3Update = useCallback((day: GZCLPDay, index: number, templateId: string | null) => {
    setAssignments((prev) => ({
      ...prev,
      t3Exercises: {
        ...prev.t3Exercises,
        [day]: prev.t3Exercises[day].map((t, i) => (i === index ? (templateId ?? '') : t)),
      },
    }))
  }, [])

  const handleWeightChange = useCallback((key: string, weight: number) => {
    setWeights((prev) => ({
      ...prev,
      [key]: weight,
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
    // Check if at least one main lift is assigned
    const hasMainLift = MAIN_LIFT_ROLES.some((role) => assignments.mainLifts[role] !== null)
    if (!hasMainLift) {
      return
    }
    setCurrentStep('weights')
  }, [assignments])

  const handleWeightsNext = useCallback(() => {
    // Just advance to next-workout step
    // State will be built atomically in handleNextWorkoutComplete
    setCurrentStep('next-workout')
  }, [])

  // Count assigned exercises (main lifts + T3s across all days)
  const assignedMainLifts = MAIN_LIFT_ROLES.filter((role) => assignments.mainLifts[role] !== null).length
  // Phase 9: Count unique T3s across all days (deduplicated)
  const allT3TemplateIds = new Set(
    (['A1', 'B1', 'A2', 'B2'] as GZCLPDay[]).flatMap((day) =>
      assignments.t3Exercises[day].filter((id) => id !== '')
    )
  )
  const assignedT3s = allT3TemplateIds.size
  const assignedCount = assignedMainLifts + assignedT3s

  const handleBack = useCallback(() => {
    switch (currentStep) {
      case 'routine-assign':
        setCurrentStep('welcome')
        break
      case 'import-review':
        setCurrentStep('routine-assign')
        break
      case 'next-workout':
        // Go back to import-review if import path, or weights if create path
        setCurrentStep(routineSourceMode === 'import' ? 'import-review' : 'weights')
        break
      case 'exercises':
        setCurrentStep('welcome')
        break
      case 'weights':
        setCurrentStep('exercises')
        break
      default:
        break
    }
  }, [currentStep, routineSourceMode])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress indicator - dynamic based on path */}
        {(() => {
          // Create path shows: Welcome → Exercises → Weights → Next → Done
          // Import path shows: Welcome → Assign → Review → Next → Done
          const createSteps: SetupStep[] = ['welcome', 'exercises', 'weights', 'next-workout', 'complete']
          const importSteps: SetupStep[] = ['welcome', 'routine-assign', 'import-review', 'next-workout', 'complete']
          const createLabels = ['Welcome', 'Exercises', 'Weights', 'Next', 'Done']
          const importLabels = ['Welcome', 'Assign', 'Review', 'Next', 'Done']

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
                                       : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                 }`}
                    >
                      {index + 1}
                    </div>
                    {index < steps.length - 1 && <div className="w-8 h-0.5 bg-gray-200 dark:bg-gray-700 mx-1" />}
                  </div>
                ))}
              </div>
              <div className="flex justify-center mt-2 text-xs text-gray-500 dark:text-gray-400">
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
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          {currentStep === 'welcome' && (
            <WelcomeStep
              onComplete={handleWelcomeComplete}
              onValidateKey={handleValidateApiKey}
              isValidating={hevy.isConnecting}
              validationError={hevy.connectionError}
              hasRoutines={hevy.routines.length > 0}
              isLoadingRoutines={hevy.isLoadingRoutines}
            />
          )}

          {currentStep === 'routine-assign' && (
            <RoutineAssignmentStep
              routines={routineImport.availableRoutines}
              assignment={routineImport.assignment}
              onAssign={handleRoutineAssign}
              onNext={handleRoutineAssignNext}
              onBack={handleBack}
              isLoading={routineImport.isExtracting}
            />
          )}

          {currentStep === 'import-review' && routineImport.importResult && (
            <ImportReviewStep
              importResult={routineImport.importResult}
              onDayExerciseUpdate={handleDayExerciseUpdate}
              onDayT3Update={routineImport.updateDayT3}
              onDayT3Remove={handleDayT3Remove}
              onNext={handleImportReviewNext}
              onBack={handleImportReviewBack}
              apiKey={program.state.apiKey}
              mainLiftWeights={routineImport.mainLiftWeights}
              onMainLiftWeightsUpdate={handleMainLiftWeightsUpdate}
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
              onMainLiftAssign={handleMainLiftAssign}
              onT3Add={handleT3Add}
              onT3Remove={handleT3Remove}
              onT3Update={handleT3Update}
              selectedDay={selectedDay}
              onDayChange={handleDaySelect}
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
        {currentStep !== 'welcome' &&
          currentStep !== 'routine-assign' &&
          currentStep !== 'import-review' &&
          currentStep !== 'next-workout' &&
          currentStep !== 'complete' && (
          <div className="flex justify-between">
            <button
              type="button"
              onClick={handleBack}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 min-h-[44px]"
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
