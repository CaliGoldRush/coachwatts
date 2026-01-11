# Admin Statistics Refactor Plan

## Objective

Refactor the single `/admin/stats` page into a hierarchical structure with a central hub and detailed sub-pages for specific system metrics.

## Proposed Structure & Detailed Visualization Plan

### 1. Hub (`/admin/stats`)

**Goal:** High-level system health and navigation.

- **Charts:**
  - **Workouts Per Day** (Last 30 Days)
    - _Type:_ Bar Chart (CSS-based, vertical bars)
    - _Metrics:_ Date vs. Count of workouts imported/created.
  - **AI Cost Trends** (Last 30 Days)
    - _Type:_ Bar Chart (CSS-based)
    - _Metrics:_ Date vs. Estimated Cost ($).
  - **New Users Per Day** (Last 30 Days)
    - _Type:_ Bar Chart (CSS-based)
    - _Metrics:_ Date vs. Count of new signups.
  - **Active Users Per Day** (Last 30 Days)
    - _Type:_ Bar Chart (CSS-based)
    - _Metrics:_ Date vs. Count of unique users logging activity.

- **KPI Cards:**
  - Avg Workouts/Day (Number)
  - Users Joined (30d) (Number)
  - Avg AI Cost/Call ($)
  - AI Success Rate (%)
  - Total AI Calls (Number)

- **Navigation:**
  - Grid of 5 cards linking to sub-pages with icons.

---

### 2. User Statistics (`/admin/stats/users`)

**Goal:** Growth, engagement, and ecosystem integration.

- **KPI Cards (Top Row):**
  - **Total Users**: All-time registered users.
  - **Active (30d)**: Users who logged an activity in the last 30 days.
  - **Inactive**: Total - Active.
  - **Retention Rate**: (Active / Total) \* 100.

- **Visualizations:**
  - **Integrations** (Card with List & Progress Bars)
    - _Type:_ List with horizontal progress bars.
    - _Metrics:_ Provider Name (Intervals, Whoop, etc.) vs. Count of connected users.
  - **Sharing Activity** (Card with Stats)
    - _Type:_ Summary list.
    - _Metrics:_ Total Shared Items count; Breakdown by Resource Type (Workout, Report, Nutrition) count.
  - **Authentication Methods** (Card with Badges)
    - _Type:_ Flex grid of badges.
    - _Metrics:_ Auth Provider (Google, etc.) vs. Count of users.

---

### 3. LLM Intelligence Statistics (`/admin/stats/llm`)

**Goal:** Cost analysis, usage patterns, and error tracking.

- **KPI Cards (Top Row - Token Breakdown):**
  - **Total Tokens**: Count.
  - **Prompt Tokens**: Count & % of total.
  - **Completion Tokens**: Count & % of total.

- **Visualizations:**
  - **Usage by Model** (Card with List)
    - _Type:_ Detailed list items.
    - _Metrics:_ Model Name (e.g., gemini-pro), Call Count, Cost ($), Total Tokens.
  - **Usage by Operation** (Card with Progress Bars)
    - _Type:_ List with horizontal progress bars relative to max.
    - _Metrics:_ Operation Name (e.g., generate_report), Cost ($), Call Count.

- **Tables:**
  - **Recent Failures** (Table)
    - _Columns:_ Error Type, Date, Error Message snippet, Badges for Operation/Model.
  - **Top Spenders (30d)** (Table)
    - _Columns:_ User Name, User Email, Total Cost ($).

---

### 4. Webhook Statistics (`/admin/stats/webhooks`)

**Goal:** System integration health and event volume.

- **Charts:**
  - **Daily Event Volume** (Last 30 Days)
    - _Type:_ Bar Chart (CSS-based, vertical).
    - _Metrics:_ Date vs. Total Events received.

- **Visualizations:**
  - **Events by Provider** (Card with List)
    - _Type:_ Simple list with count badges.
    - _Metrics:_ Provider Name (e.g., stripe, withings) vs. Event Count.
  - **Processing Status** (Card with Progress Bars)
    - _Type:_ List with color-coded progress bars (Green/Red/Blue).
    - _Metrics:_ Status (PROCESSED, FAILED, PENDING) vs. Count.

- **Tables:**
  - **Recent Failures** (Table)
    - _Columns:_ Time, Provider, Event Type, Error Message (truncated).

---

### 5. Workout Statistics (`/admin/stats/workouts`)

**Goal:** Data ingestion volume and quality.

- **KPI Cards (Global Aggregates):**
  - **Total Workouts**: Count.
  - **Total Distance**: Kilometers.
  - **Total Duration**: Hours.
  - **Total TSS**: Training Stress Score points.

- **Charts:**
  - **Daily Ingestion Volume** (Last 30 Days)
    - _Type:_ Bar Chart (CSS-based, vertical).
    - _Metrics:_ Date vs. Count of workouts.

- **Visualizations:**
  - **By Type** (Card with List)
    - _Type:_ Simple list.
    - _Metrics:_ Activity Type (Ride, Run) vs. Count.
  - **By Source** (Card with List)
    - _Type:_ Simple list.
    - _Metrics:_ Source (Strava, Intervals) vs. Count.
  - **Duplicates** (Feature Card)
    - _Type:_ Big Number + Percentage.
    - _Metrics:_ Count of duplicates, % of total workouts.
  - **AI Analysis Coverage** (Feature Card)
    - _Type:_ Big Percentage + Count/Total.
    - _Metrics:_ % of workouts with AI analysis completed.

---

### 6. Developer Statistics (`/admin/stats/developers`)

**Goal:** Platform usage and API adoption.

- **KPI Cards:**
  - **API Keys**
    - _Metrics:_ Total Issued, Active (Last 30d).
  - **OAuth Apps**
    - _Metrics:_ Total Registered Apps, Public Directory Listings.
  - **User Authorizations** (OAuth Tokens)
    - _Metrics:_ Total Grants (Tokens), Active Sessions (Last 30d).

## Implementation Details

### Backend

- New API endpoints created under `server/api/admin/stats/*.get.ts` to provide specific data for each sub-page.

### Frontend

- Centralized hub at `app/pages/admin/stats/index.vue`.
- Detailed pages at `app/pages/admin/stats/*.vue`.
- Consistent styling using Nuxt UI components and CSS-based charts for performance.
