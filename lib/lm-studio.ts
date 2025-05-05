// Recipe generation with Google Gemini API integration

// Response interface for type safety
interface LMStudioResponse {
  success: boolean;
  data?: string;
  error?: string | null;
}

// Query the Gemini API through our server-side proxy
export async function queryLMStudio(
  prompt: string, 
  options?: { 
    temperature?: number, 
    maxTokens?: number,
    responseFormat?: string 
  }
): Promise<LMStudioResponse> {
  try {
    console.log("Connecting to Gemini API via server-side API route");
    
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt,
        temperature: options?.temperature ?? 0.7,
        maxTokens: options?.maxTokens ?? 1024,
        responseFormat: options?.responseFormat
      }),
    });

    if (!response.ok) {
      console.error("API error:", response.status, response.statusText);
      let errorData;
      try {
        errorData = await response.json();
        console.error("Error data:", errorData);
      } catch (e) {
        console.error("Could not parse error response");
      }
      
      return {
        success: false,
        error: errorData?.error || `API error ${response.status}: ${response.statusText}`
      };
    }

    const data = await response.json();
    
    if (data.choices && data.choices.length > 0) {
      console.log("Recipe generated successfully");
      return {
        success: true,
        data: data.choices[0].message.content
      };
    } else {
      console.error("Invalid response format:", data);
      return {
        success: false,
        error: 'Invalid response format'
      };
    }
  } catch (error) {
    console.error('Connection error:', error);
    return {
      success: false,
      error: `Failed to connect: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

// Function for generating custom meal suggestions
export async function suggestMeal(
  ingredients: string[], 
  preferences?: { 
    dietType?: string, 
    allergies?: string[] 
  }
): Promise<LMStudioResponse> {
  const { dietType, allergies } = preferences || {};
  
  const prompt = `
  Create a delicious recipe using some or all of these ingredients: ${ingredients.join(', ')}
  
  ${dietType ? `Diet type: ${dietType}` : ''}
  ${allergies && allergies.length > 0 ? `Allergies to avoid: ${allergies.join(', ')}` : ''}
  
  IMPORTANT: Give the recipe a creative, specific name (not just "Custom Recipe").
  
  Provide the recipe with:
  - Recipe name (be creative and specific)
  - Core ingredients with quantities (using the ingredients I provided)
  - Suggested additional ingredients that would enhance the recipe (mark these as optional)
  - Step-by-step instructions
  - Nutrition information per serving:
    - Calories: X kcal (use a realistic number)
    - Protein: X g (use a realistic number)
    - Carbs: X g (use a realistic number)
    - Fat: X g (use a realistic number)
  
  Make sure to include realistic nutritional values for the recipe. Don't use placeholders like 'X' or '0'.
  Format your response clearly separating core ingredients from optional additional ingredients.
  `;
  
  return queryLMStudio(prompt);
}

// Function for generating personalized meal plans
export async function suggestMealPlan(
  preferences: { 
    goal?: string,
    dietType?: string, 
    allergies?: string[],
    cuisinePreference?: string[],
    exclusions?: string[],
    dailyCalories?: number,
    days?: number
  }
): Promise<LMStudioResponse> {
  const { 
    goal, 
    dietType, 
    allergies, 
    cuisinePreference, 
    exclusions,
    dailyCalories = 2000,
    days = 7
  } = preferences || {};
  
  // Create a structured prompt with clear formatting instructions
  const prompt = `
  Create a detailed ${days}-day meal plan based on the following preferences:
  
  ${goal ? `Goal: ${goal}` : ''}
  ${dietType ? `Diet type: ${dietType}` : ''}
  ${allergies && allergies.length > 0 ? `Allergies to avoid: ${allergies.join(', ')}` : ''}
  ${cuisinePreference && cuisinePreference.length > 0 ? `Preferred cuisines: ${cuisinePreference.join(', ')}` : ''}
  ${exclusions && exclusions.length > 0 ? `Excluded foods: ${exclusions.join(', ')}` : ''}
  Target daily calories: ${dailyCalories} kcal
  
  For each day, provide:
  - Day of the week
  - 4 meals (Breakfast, Lunch, Snack, Dinner)
  - For each meal include:
     - Name of the dish
     - Time to eat
     - Calories
     - Macronutrients (protein, carbs, fat)
     - Alternative options to replace ingredients if desired
  
  VERY IMPORTANT REQUIREMENTS:
  1. Your response MUST be in valid JSON format
  2. Do NOT include any explanations or text outside the JSON 
  3. Make sure all numeric values are actual numbers, not strings
  4. Include at least 2-3 alternatives for each meal
  5. Do not use any special characters that would break JSON parsing
  6. Ensure VARIETY - do not repeat the same dishes across different days
  7. Be creative with meal options - each day should have different dishes
  8. For breakfast, lunch, dinner and snacks, ensure variety across the days
  9. Make sure all meals are diverse and don't repeat the same base ingredients
  
  Use exactly this JSON structure:
  
  {
    "dailyCalories": 2000,
    "days": [
      {
        "day": "Monday",
        "meals": [
          {
            "name": "Breakfast",
            "dish": "Vegetable Upma with Green Chutney",
            "calories": 320,
            "protein": 15,
            "carbs": 40,
            "fat": 10,
            "time": "8:00 AM",
            "alternatives": ["Oatmeal with fruits", "Whole grain toast with avocado"]
          },
          {
            "name": "Lunch",
            "dish": "Lentil Soup with Brown Rice",
            "calories": 420,
            "protein": 20,
            "carbs": 65,
            "fat": 8,
            "time": "1:00 PM",
            "alternatives": ["Chickpea Salad", "Quinoa Bowl"]
          }
        ]
      }
    ]
  }
  `;
  
  // Use the enhanced responseFormat parameter to indicate we need JSON
  const response = await queryLMStudio(prompt, { 
    responseFormat: 'json',
    temperature: 0.8,  // Increased temperature for more creative and diverse outputs
    maxTokens: 2048    // Increase token limit for longer meal plans
  });
  
  // If successful but response is not in valid JSON format, try to extract and fix it
  if (response.success && response.data) {
    try {
      // First attempt: Try parsing directly
      JSON.parse(response.data);
      return response;
    } catch (err) {
      console.log("Response is not valid JSON, attempting to extract and fix JSON...");
      
      // Second attempt: Remove markdown code blocks
      let cleanedData = response.data.replace(/```json\s*|\s*```/g, '');
      try {
        JSON.parse(cleanedData);
        return {
          success: true,
          data: cleanedData
        };
      } catch (error) {
        console.log("Still not valid JSON after removing code blocks");
      }
      
      // Third attempt: Extract JSON pattern
      const jsonMatch = response.data.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const extractedJson = jsonMatch[0];
        try {
          JSON.parse(extractedJson);
          return {
            success: true,
            data: extractedJson
          };
        } catch (innerErr) {
          console.error("Extracted content is not valid JSON:", innerErr);
        }
      }
      
      // Fourth attempt: Fix common JSON syntax issues
      try {
        // Replace single quotes with double quotes
        cleanedData = response.data.replace(/'/g, '"');
        
        // Make sure property names are in double quotes
        cleanedData = cleanedData.replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3');
        
        // Remove trailing commas in arrays and objects
        cleanedData = cleanedData.replace(/,(\s*[\]}])/g, '$1');
        
        // Try to parse after fixing
        JSON.parse(cleanedData);
        return {
          success: true,
          data: cleanedData
        };
      } catch (fixErr) {
        console.error("Could not fix JSON formatting:", fixErr);
      }
      
      // Fifth attempt: Generate a fallback meal plan if everything else fails
      try {
        // Simple fallback data structure with minimal content
        const fallbackPlan = {
          dailyCalories: dailyCalories,
          days: Array.from({ length: days }, (_, i) => ({
            day: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][i % 7],
            meals: [
              {
                name: "Breakfast",
                dish: dietType === "vegetarian" ? "Oatmeal with Fruits" : "Scrambled Eggs with Toast",
                calories: Math.round(dailyCalories * 0.25),
                protein: 15,
                carbs: 30,
                fat: 10,
                time: "8:00 AM",
                alternatives: ["Yogurt with Granola", "Fruit Smoothie"]
              },
              {
                name: "Lunch",
                dish: dietType === "vegetarian" ? "Lentil Soup with Rice" : "Grilled Chicken Salad",
                calories: Math.round(dailyCalories * 0.35),
                protein: 25,
                carbs: 45,
                fat: 15,
                time: "1:00 PM",
                alternatives: ["Quinoa Bowl", "Vegetable Wrap"]
              },
              {
                name: "Snack",
                dish: "Mixed Nuts and Dried Fruits",
                calories: Math.round(dailyCalories * 0.15),
                protein: 5,
                carbs: 15,
                fat: 10,
                time: "4:00 PM",
                alternatives: ["Greek Yogurt", "Protein Bar"]
              },
              {
                name: "Dinner",
                dish: dietType === "vegetarian" ? "Vegetable Stir Fry with Tofu" : "Baked Fish with Vegetables",
                calories: Math.round(dailyCalories * 0.25),
                protein: 20,
                carbs: 30,
                fat: 10,
                time: "8:00 PM",
                alternatives: ["Soup and Salad", "Steamed Vegetables with Rice"]
              }
            ]
          }))
        };
        
        return {
          success: true,
          data: JSON.stringify(fallbackPlan),
          error: "Used fallback meal plan due to JSON parsing errors"
        };
      } catch (fallbackErr) {
        console.error("Even fallback plan creation failed:", fallbackErr);
      }
      
      // If all attempts fail, return the original response
      return {
        success: false,
        error: "Could not process the meal plan data. Please try again."
      };
    }
  }
  
  return response;
}
