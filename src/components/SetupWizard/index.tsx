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
import { MAIN_LIFT_ROLES, type MainLiftRole, type Tier } from '@/types/state'
import type { GZCLPDay, WeightUnit, RoutineSourceMode, ImportedExercise } from '@/types/state'
import { getProgressionKey } from '@/lib/role-utils'

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
  }) => {
    setRoutineSourceMode(data.path)
    program.setWeightUnit(data.unit)
    setUnit(data.unit)
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
      const { byDay } = routineImport.importResult

      // Track saved exercise IDs for t3Schedule
      const savedExerciseIds = new Map<string, string>() // templateId -> exerciseId
      // Track which main lift progression keys have been set (to avoid duplicates)
      const processedProgressionKeys = new Set<string>()

      // Process all days and exercises
      for (const day of ['A1', 'B1', 'A2', 'B2'] as GZCLPDay[]) {
        const dayData = byDay[day]

        // Process T1 exercise (if exists and has main lift role)
        if (dayData.t1?.role && MAIN_LIFT_ROLES.includes(dayData.t1.role as MainLiftRole)) {
          const imported = dayData.t1
          const role = imported.role as MainLiftRole

          // Add exercise if not already added
          let exerciseId = savedExerciseIds.get(imported.templateId)
          if (!exerciseId) {
            exerciseId = program.addExercise({
              hevyTemplateId: imported.templateId,
              name: imported.name,
              role: imported.role,
            })
            savedExerciseIds.set(imported.templateId, exerciseId)
          }

          // Set T1 progression using role-tier key (Bug Fix Phase 7)
          const t1Key = getProgressionKey(exerciseId, role, 'T1')
          if (!processedProgressionKeys.has(t1Key)) {
            const weight = imported.userWeight ?? imported.detectedWeight
            const stage = imported.userStage ?? imported.detectedStage
            program.setProgressionByKey(t1Key, exerciseId, weight, stage)
            processedProgressionKeys.add(t1Key)
          }
        }

        // Process T2 exercise (if exists and has main lift role)
        if (dayData.t2?.role && MAIN_LIFT_ROLES.includes(dayData.t2.role as MainLiftRole)) {
          const imported = dayData.t2
          const role = imported.role as MainLiftRole

          // Add exercise if not already added
          let exerciseId = savedExerciseIds.get(imported.templateId)
          if (!exerciseId) {
            exerciseId = program.addExercise({
              hevyTemplateId: imported.templateId,
              name: imported.name,
              role: imported.role,
            })
            savedExerciseIds.set(imported.templateId, exerciseId)
          }

          // Set T2 progression using role-tier key (Bug Fix Phase 7)
          const t2Key = getProgressionKey(exerciseId, role, 'T2')
          if (!processedProgressionKeys.has(t2Key)) {
            const weight = imported.userWeight ?? imported.detectedWeight
            const stage = imported.userStage ?? imported.detectedStage
            program.setProgressionByKey(t2Key, exerciseId, weight, stage)
            processedProgressionKeys.add(t2Key)
          }
        }

        // Process T3 exercises (still use exerciseId as key)
        for (const t3 of dayData.t3s) {
          if (!t3.templateId) continue

          // Add exercise if not already added
          let exerciseId = savedExerciseIds.get(t3.templateId)
          if (!exerciseId) {
            exerciseId = program.addExercise({
              hevyTemplateId: t3.templateId,
              name: t3.name,
              role: t3.role ?? 't3',
            })
            savedExerciseIds.set(t3.templateId, exerciseId)

            // Set T3 progression by exerciseId (unchanged behavior)
            const weight = t3.userWeight ?? t3.detectedWeight
            program.setInitialWeight(exerciseId, weight)
          }
        }
      }

      // Build and save t3Schedule from byDay structure
      const t3Schedule: Record<GZCLPDay, string[]> = {
        A1: [],
        B1: [],
        A2: [],
        B2: [],
      }

      for (const day of ['A1', 'B1', 'A2', 'B2'] as GZCLPDay[]) {
        const dayData = byDay[day]
        t3Schedule[day] = dayData.t3s
          .filter((t3) => t3.templateId && savedExerciseIds.has(t3.templateId))
          .map((t3) => savedExerciseIds.get(t3.templateId) ?? '')
          .filter((id) => id !== '')
      }

      program.setT3Schedule(t3Schedule)

      // Save routine IDs to program
      program.setRoutineIds(routineImport.assignment)
    }

    // Set current day and complete
    program.setCurrentDay(selectedDay)
    setCurrentStep('complete')
  }, [routineSourceMode, routineImport, selectedDay, program])

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
      for (const templateId of assignments.t3Exercises[day]) {
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
    <div className="min-h-screen bg-gray-50 py-8 px-4">
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
        {currentStep !== 'welcome' &&
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
