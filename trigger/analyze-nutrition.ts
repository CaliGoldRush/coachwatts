import { logger, task } from "@trigger.dev/sdk/v3";
import { generateStructuredAnalysis } from "../server/utils/gemini";
import { prisma } from "../server/utils/db";

// Analysis schema for nutrition
const nutritionAnalysisSchema = {
  type: "object",
  properties: {
    type: {
      type: "string",
      description: "Type of analysis: nutrition",
      enum: ["nutrition"]
    },
    title: {
      type: "string",
      description: "Title of the analysis"
    },
    date: {
      type: "string",
      description: "Date of the nutrition entry"
    },
    executive_summary: {
      type: "string",
      description: "2-3 sentence high-level summary of key findings about nutrition quality and completeness"
    },
    data_completeness: {
      type: "object",
      description: "Assessment of whether the user logged their full day",
      properties: {
        status: {
          type: "string",
          enum: ["complete", "mostly_complete", "partial", "incomplete"],
          description: "Overall completeness status"
        },
        confidence: {
          type: "number",
          description: "Confidence level (0-1) that the data represents a full day"
        },
        missing_meals: {
          type: "array",
          items: { type: "string" },
          description: "List of likely missing meals or gaps"
        },
        reasoning: {
          type: "string",
          description: "Explanation of completeness assessment"
        }
      },
      required: ["status", "confidence", "reasoning"]
    },
    sections: {
      type: "array",
      description: "Analysis sections with status and points",
      items: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "Section title (e.g., Macro Balance, Calorie Adherence)"
          },
          status: {
            type: "string",
            description: "Overall assessment",
            enum: ["excellent", "good", "moderate", "needs_improvement", "poor"]
          },
          status_label: {
            type: "string",
            description: "Display label for status"
          },
          analysis_points: {
            type: "array",
            description: "Detailed analysis points for this section",
            items: {
              type: "string"
            }
          }
        },
        required: ["title", "status", "analysis_points"]
      }
    },
    recommendations: {
      type: "array",
      description: "Actionable recommendations",
      items: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "Recommendation title"
          },
          description: {
            type: "string",
            description: "Detailed recommendation"
          },
          priority: {
            type: "string",
            description: "Priority level",
            enum: ["high", "medium", "low"]
          }
        },
        required: ["title", "description"]
      }
    },
    strengths: {
      type: "array",
      description: "Key strengths identified",
      items: {
        type: "string"
      }
    },
    areas_for_improvement: {
      type: "array",
      description: "Areas needing improvement",
      items: {
        type: "string"
      }
    },
    metrics_summary: {
      type: "object",
      description: "Key metrics at a glance",
      properties: {
        calories: { type: "number" },
        calories_goal: { type: "number" },
        protein_g: { type: "number" },
        carbs_g: { type: "number" },
        fat_g: { type: "number" },
        water_l: { type: "number" }
      }
    }
  },
  required: ["type", "title", "executive_summary", "data_completeness", "sections"]
}

export const analyzeNutritionTask = task({
  id: "analyze-nutrition",
  maxDuration: 300, // 5 minutes for AI processing
  queue: {
    concurrencyLimit: 2, // Only run 2 analyses in parallel
  },
  run: async (payload: { nutritionId: string }) => {
    const { nutritionId } = payload;
    
    logger.log("Starting nutrition analysis", { nutritionId });
    
    // Update nutrition status to PROCESSING
    await prisma.nutrition.update({
      where: { id: nutritionId },
      data: { aiAnalysisStatus: 'PROCESSING' }
    });
    
    try {
      // Fetch the nutrition record
      const nutrition = await prisma.nutrition.findUnique({
        where: { id: nutritionId }
      });
      
      if (!nutrition) {
        throw new Error('Nutrition record not found');
      }
      
      logger.log("Nutrition data fetched", { 
        nutritionId,
        date: nutrition.date,
        calories: nutrition.calories
      });
      
      // Build comprehensive nutrition data for analysis
      const nutritionData = buildNutritionAnalysisData(nutrition);
      
      // Generate the prompt
      const prompt = buildNutritionAnalysisPrompt(nutritionData);
      
      logger.log("Generating structured analysis with Gemini Flash");
      
      // Generate structured JSON analysis
      const structuredAnalysis = await generateStructuredAnalysis(prompt, nutritionAnalysisSchema, 'flash');
      
      // Also generate markdown for fallback/export
      const markdownAnalysis = convertStructuredToMarkdown(structuredAnalysis);
      
      logger.log("Analysis generated successfully", {
        sections: structuredAnalysis.sections?.length || 0,
        recommendations: structuredAnalysis.recommendations?.length || 0,
        completeness: structuredAnalysis.data_completeness?.status
      });
      
      // Save both formats to the database
      await prisma.nutrition.update({
        where: { id: nutritionId },
        data: {
          aiAnalysis: markdownAnalysis,
          aiAnalysisJson: structuredAnalysis as any,
          aiAnalysisStatus: 'COMPLETED',
          aiAnalyzedAt: new Date()
        }
      });
      
      logger.log("Analysis saved to database");
      
      return {
        success: true,
        nutritionId,
        analysisLength: markdownAnalysis.length,
        sectionsCount: structuredAnalysis.sections?.length || 0
      };
    } catch (error) {
      logger.error("Error generating nutrition analysis", { error });
      
      await prisma.nutrition.update({
        where: { id: nutritionId },
        data: {
          aiAnalysisStatus: 'FAILED'
        }
      });
      
      throw error;
    }
  }
});

function buildNutritionAnalysisData(nutrition: any) {
  const data: any = {
    id: nutrition.id,
    date: nutrition.date,
    calories: nutrition.calories,
    calories_goal: nutrition.caloriesGoal,
    protein: nutrition.protein,
    protein_goal: nutrition.proteinGoal,
    carbs: nutrition.carbs,
    carbs_goal: nutrition.carbsGoal,
    fat: nutrition.fat,
    fat_goal: nutrition.fatGoal,
    fiber: nutrition.fiber,
    sugar: nutrition.sugar,
    water_ml: nutrition.waterMl
  }
  
  // Extract meal data
  if (nutrition.breakfast) data.breakfast = nutrition.breakfast
  if (nutrition.lunch) data.lunch = nutrition.lunch
  if (nutrition.dinner) data.dinner = nutrition.dinner
  if (nutrition.snacks) data.snacks = nutrition.snacks
  
  return data
}

function buildNutritionAnalysisPrompt(nutritionData: any): string {
  const formatMetric = (value: any, decimals = 1) => {
    return value !== undefined && value !== null ? Number(value).toFixed(decimals) : 'N/A'
  }
  
  let prompt = `You are an expert nutrition coach analyzing a day's food intake. Provide a comprehensive, supportive analysis.

## Nutrition Summary for ${new Date(nutritionData.date).toLocaleDateString()}

### Daily Totals
- **Calories**: ${nutritionData.calories || 'Not tracked'}${nutritionData.calories_goal ? ` / ${nutritionData.calories_goal} kcal goal` : ''}
- **Protein**: ${nutritionData.protein ? formatMetric(nutritionData.protein, 0) + 'g' : 'Not tracked'}${nutritionData.protein_goal ? ` / ${formatMetric(nutritionData.protein_goal, 0)}g goal` : ''}
- **Carbohydrates**: ${nutritionData.carbs ? formatMetric(nutritionData.carbs, 0) + 'g' : 'Not tracked'}${nutritionData.carbs_goal ? ` / ${formatMetric(nutritionData.carbs_goal, 0)}g goal` : ''}
- **Fat**: ${nutritionData.fat ? formatMetric(nutritionData.fat, 0) + 'g' : 'Not tracked'}${nutritionData.fat_goal ? ` / ${formatMetric(nutritionData.fat_goal, 0)}g goal` : ''}
`

  if (nutritionData.fiber) {
    prompt += `- **Fiber**: ${formatMetric(nutritionData.fiber, 0)}g (target: 25-30g for optimal health)\n`
  }
  
  if (nutritionData.sugar) {
    prompt += `- **Sugar**: ${formatMetric(nutritionData.sugar, 0)}g (recommended: <50g daily)\n`
  }
  
  if (nutritionData.water_ml) {
    prompt += `- **Water**: ${formatMetric(nutritionData.water_ml / 1000, 1)}L (target: 2-3L daily)\n`
  }

  // Meal breakdown
  prompt += '\n### Meal Breakdown\n'
  
  const meals = ['breakfast', 'lunch', 'dinner', 'snacks']
  let mealCount = 0
  let totalItems = 0
  
  for (const meal of meals) {
    if (nutritionData[meal] && Array.isArray(nutritionData[meal]) && nutritionData[meal].length > 0) {
      mealCount++
      const mealItems = nutritionData[meal]
      totalItems += mealItems.length
      
      prompt += `\n**${meal.charAt(0).toUpperCase() + meal.slice(1)}** (${mealItems.length} items):\n`
      
      // Calculate meal totals from items
      let mealCalories = 0
      let mealProtein = 0
      let mealCarbs = 0
      let mealFat = 0
      
      // List items with their macros
      mealItems.forEach((item: any, index: number) => {
        const itemName = item.product_name || item.name || 'Unknown item'
        const itemAmount = item.amount ? `${item.amount}${item.serving ? item.serving : 'g'}` : ''
        
        prompt += `  ${index + 1}. ${itemName}`
        if (itemAmount) prompt += ` (${itemAmount})`
        if (item.product_brand) prompt += ` - ${item.product_brand}`
        prompt += '\n'
        
        // Aggregate macros
        if (item.calories) mealCalories += item.calories
        if (item.protein) mealProtein += item.protein
        if (item.carbs) mealCarbs += item.carbs
        if (item.fat) mealFat += item.fat
      })
      
      // Show meal totals
      prompt += `  **Meal Totals**: ${Math.round(mealCalories)} kcal`
      if (mealProtein > 0) prompt += `, ${formatMetric(mealProtein, 0)}g protein`
      if (mealCarbs > 0) prompt += `, ${formatMetric(mealCarbs, 0)}g carbs`
      if (mealFat > 0) prompt += `, ${formatMetric(mealFat, 0)}g fat`
      prompt += '\n'
    }
  }
  
  if (mealCount === 0) {
    prompt += 'No meal data logged. Only daily totals are available.\n'
  } else {
    prompt += `\n**Total Meals Logged**: ${mealCount} meals with ${totalItems} food items\n`
  }

  prompt += `

## Analysis Request

You are a supportive, encouraging nutrition coach analyzing this day's food intake. Use a friendly, conversational tone.

IMPORTANT: First assess **data completeness**. Consider:
- Are all main meals (breakfast, lunch, dinner) logged?
- Does the total calorie count suggest a full day was tracked?
- Are there suspicious gaps or unusually low totals?
- Is this likely a complete log or partial tracking?

Provide structured analysis with these sections:

1. **Data Completeness Assessment**:
   - Status: complete/mostly_complete/partial/incomplete
   - Confidence: 0.0-1.0 (how confident are you this represents a full day?)
   - Missing meals: List any likely missing meals
   - Reasoning: 2-3 sentences explaining your assessment

2. **Executive Summary**: Write 2-3 friendly, encouraging sentences highlighting the most important findings. Be honest but supportive.

3. **Macro Balance** (Protein/Carbs/Fat ratios):
   - Assign status: excellent/good/moderate/needs_improvement/poor
   - Provide 3-5 separate, concise bullet points (each as a separate array item)
   - Each point should be 1-2 sentences maximum
   - Assess if macros are appropriate for an athlete

4. **Calorie Adherence** (if goals are set):
   - Assign status: excellent/good/moderate/needs_improvement/poor
   - Provide 3-5 separate, concise bullet points
   - Assess if intake matches goals and training demands

5. **Nutrition Quality**:
   - Assign status: excellent/good/moderate/needs_improvement/poor
   - Provide 3-5 separate, concise bullet points
   - Assess variety, whole foods vs processed, micronutrients, timing

6. **Hydration** (if water data available):
   - Assign status: excellent/good/moderate/needs_improvement/poor
   - Provide 2-3 bullet points about hydration adequacy

7. **Recommendations**: Provide 2-4 specific, actionable recommendations with:
   - Clear, friendly title
   - Supportive, encouraging description (2-3 sentences)
   - Priority level (high/medium/low)

8. **Strengths & Areas for Improvement**:
   - List 2-4 key strengths (short phrases or single sentences)
   - List 2-4 areas for improvement (short phrases, framed positively)

IMPORTANT:
- Each analysis_point must be a separate, concise item in the array
- Use a friendly, supportive coaching tone throughout
- Be specific with numbers but keep language conversational
- Focus on encouragement and actionable advice
- Always consider data completeness when making assessments
- If data seems incomplete, acknowledge this and adjust recommendations accordingly`

  return prompt
}

// Convert structured analysis to markdown for fallback/export
function convertStructuredToMarkdown(analysis: any): string {
  let markdown = `# ${analysis.title}\n\n`
  
  if (analysis.date) {
    markdown += `Date: ${analysis.date}\n\n`
  }
  
  // Data Completeness
  if (analysis.data_completeness) {
    const dc = analysis.data_completeness
    markdown += `## Data Completeness: ${dc.status}\n`
    markdown += `Confidence: ${Math.round(dc.confidence * 100)}%\n`
    if (dc.missing_meals && dc.missing_meals.length > 0) {
      markdown += `Potentially missing: ${dc.missing_meals.join(', ')}\n`
    }
    markdown += `\n${dc.reasoning}\n\n`
  }
  
  markdown += `## Executive Summary\n${analysis.executive_summary}\n\n`
  
  // Sections
  if (analysis.sections) {
    for (const section of analysis.sections) {
      markdown += `## ${section.title}\n`
      markdown += `**Status**: ${section.status_label || section.status}\n`
      if (section.analysis_points && section.analysis_points.length > 0) {
        for (const point of section.analysis_points) {
          markdown += `- ${point}\n`
        }
      }
      markdown += '\n'
    }
  }
  
  // Recommendations
  if (analysis.recommendations && analysis.recommendations.length > 0) {
    markdown += `## Recommendations\n`
    for (const rec of analysis.recommendations) {
      markdown += `### ${rec.title}\n`
      markdown += `${rec.description}\n\n`
    }
  }
  
  // Strengths & Areas for Improvement
  if (analysis.strengths || analysis.areas_for_improvement) {
    markdown += `## Strengths & Areas for Improvement\n`
    
    if (analysis.strengths && analysis.strengths.length > 0) {
      markdown += `### Strengths\n`
      for (const strength of analysis.strengths) {
        markdown += `- ${strength}\n`
      }
      markdown += '\n'
    }
    
    if (analysis.areas_for_improvement && analysis.areas_for_improvement.length > 0) {
      markdown += `### Areas for Improvement\n`
      for (const area of analysis.areas_for_improvement) {
        markdown += `- ${area}\n`
      }
    }
  }
  
  return markdown
}