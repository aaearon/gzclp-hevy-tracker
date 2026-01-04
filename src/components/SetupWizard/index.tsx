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
import { SlotAssignmentStep, type CreatePathAssignments } from './SlotAssignment'
import { WeightSetupStep } from './WeightSetupStep'
import { SetupComplete } from './SetupComplete'
import { useHevyApi } from '@/hooks/useHevyApi'
import { useProgram } from '@/hooks/useProgram'
import { useRoutineImport } from '@/hooks/useRoutineImport'
import { MAIN_LIFT_ROLES, type MainLiftRole } from '@/types/state'
import type { GZCLPDay, WeightUnit, RoutineSourceMode, ImportedExercise } from '@/types/state'

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

const initialAssignments: CreatePathAssignments = {
  mainLifts: { squat: null, bench: null, ohp: null, deadlift: null },
  t3Exercises: { A1: [], B1: [], A2: [], B2: [] },  // Phase 9: per-day T3s
}

export function SetupWizard({ onComplete }: SetupWizardProps) {
  const [currentStep, setCurrentStep] = useState<SetupStep>('api-key')
  const [routineSourceMode, setRoutineSourceMode] = useState<RoutineSourceMode | null>(null)
  const [assignments, setAssignments] = useState<CreatePathAssignments>(initialAssignments)
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

  const handleNextWorkoutComplete = useCallback(() => {
    if (routineSourceMode === 'import' && routineImport.importResult) {
      const { exercises: importedExercises, byDay } = routineImport.importResult
      const { mainLiftWeights } = routineImport

      // BUG FIX (Phase 8): Create weight lookup from mainLiftWeights
      // This contains user-verified T1 weights from MainLiftVerification component
      const mainLiftWeightMap = new Map(
        mainLiftWeights.map((w) => [w.role, { weight: w.t1.weight, stage: w.t1.stage }])
      )

      // Track saved exercise IDs for t3Schedule
      const savedExerciseIds = new Map<string, string>() // templateId -> exerciseId

      for (const imported of importedExercises) {
        if (!imported.role) {
          continue // Skip exercises without roles
        }

        // Add exercise to program with role
        const exerciseId = program.addExercise({
          hevyTemplateId: imported.templateId,
          name: imported.name,
          role: imported.role,
        })

        // Track the saved exercise ID
        savedExerciseIds.set(imported.templateId, exerciseId)

        // Set initial weight and stage only for main lifts
        const isMainLift = ['squat', 'bench', 'ohp', 'deadlift'].includes(imported.role)
        if (isMainLift) {
          // BUG FIX: Use verified weight from mainLiftWeights, not detectedWeight
          const verified = mainLiftWeightMap.get(imported.role as MainLiftRole)
          const confirmedWeight = verified?.weight ?? imported.userWeight ?? imported.detectedWeight
          const confirmedStage = verified?.stage ?? imported.userStage ?? imported.detectedStage
          program.setInitialWeight(exerciseId, confirmedWeight, confirmedStage)
        }
      }

      // BUG FIX (Phase 8): Build and save t3Schedule from byDay structure
      const t3Schedule: Record<GZCLPDay, string[]> = {
        A1: [],
        B1: [],
        A2: [],
        B2: [],
      }

      for (const day of ['A1', 'B1', 'A2', 'B2'] as GZCLPDay[]) {
        const dayData = byDay[day]
        if (dayData?.t3s) {
          t3Schedule[day] = dayData.t3s
            .filter((t3) => t3.templateId && savedExerciseIds.has(t3.templateId))
            .map((t3) => savedExerciseIds.get(t3.templateId)!)
        }
      }

      program.setT3Schedule(t3Schedule)

      // Save routine IDs to program
      program.setRoutineIds(routineImport.assignment)
    }

    // Set current day and complete
    program.setCurrentDay(selectedDay)
    setCurrentStep('complete')
  }, [routineSourceMode, routineImport.importResult, routineImport.mainLiftWeights, routineImport.assignment, selectedDay, program])

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
    // Save main lifts with role field
    for (const role of MAIN_LIFT_ROLES) {
      const templateId = assignments.mainLifts[role]
      if (!templateId) continue

      const exercise = hevy.exerciseTemplates.find((ex) => ex.id === templateId)
      if (!exercise) continue

      const exerciseId = program.addExercise({
        hevyTemplateId: templateId,
        name: exercise.title,
        role: role,
      })

      const weight = weights[role] ?? 0
      program.setInitialWeight(exerciseId, weight)
    }

    // Phase 9: Save T3s with deduplication and build t3Schedule
    const savedT3Ids = new Map<string, string>() // templateId -> exerciseId
    const t3Schedule: Record<GZCLPDay, string[]> = {
      A1: [],
      B1: [],
      A2: [],
      B2: [],
    }

    for (const day of ['A1', 'B1', 'A2', 'B2'] as GZCLPDay[]) {
      for (let i = 0; i < assignments.t3Exercises[day].length; i++) {
        const templateId = assignments.t3Exercises[day][i]
        if (!templateId) continue

        // Deduplicate: same T3 on multiple days uses same exerciseId
        let exerciseId = savedT3Ids.get(templateId)
        if (!exerciseId) {
          const exercise = hevy.exerciseTemplates.find((ex) => ex.id === templateId)
          if (!exercise) continue

          exerciseId = program.addExercise({
            hevyTemplateId: templateId,
            name: exercise.title,
            role: 't3',
          })
          savedT3Ids.set(templateId, exerciseId)

          // Set weight for this T3 (only once per unique T3)
          const weight = weights[`t3_${templateId}`] ?? 0
          program.setInitialWeight(exerciseId, weight)
        }

        t3Schedule[day].push(exerciseId)
      }
    }

    // Save t3Schedule to program
    program.setT3Schedule(t3Schedule)

    // Go to next-workout step
    setCurrentStep('next-workout')
  }, [assignments, weights, hevy.exerciseTemplates, program])

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
              onDayExerciseUpdate={handleDayExerciseUpdate}
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
