# Feature: Smart Sync Reconciliation for Intervals.icu

## Context

When workouts are moved or deleted in Intervals.icu (e.g., by external adaptive coaching tools like Athletica), they disappear from the Intervals calendar. However, Coach Wattz currently only _upserts_ data during sync. This leads to "ghost" workouts persisting in the Coach Wattz calendar because the deletion event was never processed (webhook missed or not sent).

## Goal

Implement a "Reconciliation" step in the `syncPlannedWorkouts` logic. When we fetch the full list of events for a date range from Intervals.icu, we can authoritative determine which events _should_ exist. Any local event with an `externalId` that is _not_ in the remote list should be deleted.

## Implementation Plan

### 1. Update `server/utils/services/intervalsService.ts`

Modify the `syncPlannedWorkouts(userId, startDate, endDate)` method.

**Current Logic:**

1. Fetch remote events.
2. Iterate and Upsert (Create/Update).

**New Logic:**

1. Fetch remote events.
2. **Reconciliation Step:**
   a. Extract all `id`s from the remote events list (`validIds`).
   b. Query DB for all `PlannedWorkout` records for `userId` within `[startDate, endDate]` where `externalId` IS NOT NULL.
   c. Filter this list: Find records where `externalId` is NOT in `validIds`.
   d. `deleteMany` these orphaned IDs.
   e. Repeat for `Event` and `CalendarNote` tables (since the `/events` endpoint mixes these types).
3. Iterate and Upsert (existing logic).

### 2. Constraints & Safety

- **Date Range Accuracy:** The DB query must strictly respect the `startDate` and `endDate` used for the API call to avoid deleting workouts outside the sync window.
- **Local Data Protection:** ONLY delete records where `externalId` is present. Never touch local workouts (where `externalId` is null).

## Verification

- Create a test case:
  1. Manually create a "Ghost" `PlannedWorkout` in the DB for "Tomorrow" with a fake `externalId`.
  2. Run `ingest-intervals` (which calls `syncPlannedWorkouts`).
  3. Verify the "Ghost" workout is deleted.
  4. Verify valid workouts (present in Intervals) remain.
