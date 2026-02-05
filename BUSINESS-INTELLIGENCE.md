# Business Intelligence & Project Essence: Coach Watts

## 1. Project Essence

**Coach Watts** is an open-source, AI-powered endurance coaching platform (Digital Twin) for cyclists, runners, and triathletes. It solves the "Data Overload" problem by aggregating metrics from various platforms (Intervals.icu, Strava, Whoop, etc.) and using Google Gemini AI to act as a professional coach that understands both physiological data and life context.

### Core Value Proposition

- **Unified Profile:** A 360° view of the athlete (Fitness, Fatigue, Recovery, Nutrition).
- **AI-Driven Insights:** Automated workout execution scoring and wellness-based daily recommendations.
- **Adaptive Planning:** AI that adjusts training plans based on actual performance and recovery.

---

## 2. User Personas

### A. The Data-Driven Enthusiast ("The Data Geek")

- **Profile:** Highly technical, loves metrics, already uses Intervals.icu or TrainingPeaks.
- **Goal:** Wants to optimize every marginal gain using AI to spot patterns they might miss.
- **Willingness to Pay:** High (Pro Tier).

### B. The Time-Strapped Professional ("The Busy Athlete")

- **Profile:** Busy job/family, limited training time.
- **Goal:** Wants the AI to "just tell me what to do today" based on how they slept and their current fatigue.
- **Willingness to Pay:** Moderate (Supporter Tier).

### C. The Competitive Amateur ("The Goal Chaser")

- **Profile:** Training for a specific event (Gran Fondo, Marathon, Ironman).
- **Goal:** Needs a structured plan that adapts when life gets in the way.
- **Willingness to Pay:** Moderate-to-High (Supporter/Pro Tier).

---

## 3. Pricing Strategy & Sustainability

Our current model aims to balance open-source accessibility with the high infrastructure costs of LLMs and background processing.

| Tier          | Price (Monthly) | Price (Annual) | Key Value Add                                                                              |
| :------------ | :-------------- | :------------- | :----------------------------------------------------------------------------------------- |
| **FREE**      | $0              | N/A            | Smart Logbook. Unlimited history. Manual analysis triggers.                                |
| **SUPPORTER** | $8.99           | $89.99         | **Automation.** Background sync, automatic workout analysis, priority processing.          |
| **PRO**       | $14.99\*        | $119.00        | **The Real Coach.** Deep Reasoning AI (Gemini Pro), Proactive coaching, Advanced planning. |

_\*Note: While current implementation lists Pro at $14.99, user research suggests a $12.00 price point may be more optimal for conversion. Business analysis should model both scenarios._

### Sustainability Challenges

- **LLM Costs:** High-frequency workout analysis and interactive chat generate significant API costs.
- **Processing Power:** Real-time stream processing and background jobs (Trigger.dev) require consistent server resources.

---

## 4. Key Performance Indicators (KPIs)

To be tracked using the Evidence BI platform and direct PostgreSQL queries.

### A. Growth & Acquisition

- **Daily Signups:**
  ```sql
  SELECT date_trunc('day', "createdAt") as day, count(*)
  FROM "User"
  GROUP BY 1 ORDER BY 1 DESC;
  ```
- **Conversion Funnel:** Total Users -> Integrated Users (at least 1 `Integration`) -> Paid Users.

### B. Engagement & Retention

- **Active Athletes (7D):** Users with a workout or check-in in the last 7 days.
- **Analysis Engagement:**
  ```sql
  SELECT "subscriptionTier", count(*) as total_workouts,
         count(CASE WHEN "aiAnalysisStatus" = 'COMPLETED' THEN 1 END) as analyzed_workouts
  FROM "Workout" w
  JOIN "User" u ON w."userId" = u.id
  GROUP BY 1;
  ```

### C. Financial Metrics

- **Current MRR (Estimated):**
  ```sql
  SELECT
    sum(CASE WHEN "subscriptionTier" = 'SUPPORTER' THEN 8.99 ELSE 0 END) +
    sum(CASE WHEN "subscriptionTier" = 'PRO' THEN 14.99 ELSE 0 END) as estimated_mrr
  FROM "User"
  WHERE "subscriptionStatus" = 'ACTIVE';
  ```

### D. AI Cost & Performance

- **Cost per Analysis Type:**
  ```sql
  SELECT operation, avg("estimatedCost") as avg_cost, count(*) as volume
  FROM "LlmUsage"
  WHERE success = true
  GROUP BY 1;
  ```
- **Error Rate by Model:**
  ```sql
  SELECT model, count(*) FILTER (WHERE success = false)::float / count(*) as error_rate
  FROM "LlmUsage"
  GROUP BY 1;
  ```

---

## 5. Data Model for BI Analysis

The following tables are the primary sources for BI dashboards:

- **`User`**: The root of all metrics. Tracks tier, scores (Fitness, Recovery, Nutrition, Consistency), and geography.
- **`Workout`**: Performance data. Key columns: `overallScore`, `tss`, `type`, `intensity`, `source`.
- **`LlmUsage`**: Cost and performance tracking. Key columns: `model`, `promptTokens`, `completionTokens`, `estimatedCost`, `success`.
- **`DailyCheckin`**: Subjective wellness. Key columns: `status`, `date`, `questions` (JSONB).
- **`ChatMessage`**: Engagement indicator.
- **`ActivityRecommendation`**: Tracks how often users follow AI advice.

---

## 6. Strategic Goals for Business Analysis AI

1. **Churn Prediction:** Identify users with declining workout volume or missing check-ins.
2. **Pricing Optimization:** Analyze `LlmUsage` to determine if $8.99/mo covers the median user's automation costs.
3. **Feature Gap Analysis:** Correlate `ChatMessage` topics with existing features to prioritize the roadmap.
