# Test Coverage TODO List

This document lists the files that require unit test coverage or improved coverage.

## High Priority (Core Logic)

These files contain critical business logic for training metrics, calculations, and stress analysis.

- [ ] `server/utils/training-metrics.ts` (TSB, Zone Distributions, Prompt Generation)
- [ ] `server/utils/training-stress.ts` (Stress calculations)
- [ ] `server/utils/performance-metrics.ts` (Performance tracking)
- [ ] `server/utils/calculate-workout-stress.ts` (TSS/IF calculations)
- [ ] `server/utils/normalize-tss.ts` (Normalization logic)

## Medium Priority (Services & Repositories)

These files handle data access and integration logic.

- [ ] `server/utils/services/planService.ts` (Plan management)
- [ ] `server/utils/services/wellness-analysis.ts` (Wellness data processing)
- [ ] `server/utils/services/intervalsService.ts` (Integration logic)
- [ ] `server/utils/repositories/userRepository.ts` (User data access)
- [ ] `server/utils/repositories/wellnessRepository.ts` (Wellness data access)

## Frontend Logic (Composables)

These composables contain significant UI state logic that should be tested.

- [ ] `app/composables/useTrend.ts` (Trend calculation logic)
- [ ] `app/composables/useScoreColor.ts` (Color mapping logic)
- [ ] `app/composables/useWeekSummary.ts` (Weekly aggregation)
- [ ] `app/composables/useUserRuns.ts` (Background task monitoring)

## AI Tools

These tools are used by the LLM and need to be reliable.

- [ ] `server/utils/ai-tools/wellness.ts`
- [ ] `server/utils/ai-tools/nutrition.ts`
- [ ] `server/utils/ai-tools/math.ts`

## Next Steps

1.  Pick a file from the High Priority list.
2.  Create a corresponding test file in `tests/unit/server/utils/` (or co-located).
3.  Write test cases to cover the main functions and edge cases.
4.  Run `vitest` to verify.
