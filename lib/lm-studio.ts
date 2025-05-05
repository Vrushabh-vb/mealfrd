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
      const parsedData = JSON.parse(response.data);
      
      // Validate the essential structure of the meal plan
      if (!validateMealPlanStructure(parsedData)) {
        throw new Error("Invalid meal plan structure");
      }
      
      return response;
    } catch (err) {
      console.log("Response is not valid JSON, attempting to extract and fix JSON...");
      
      // Second attempt: Remove markdown code blocks
      let cleanedData = response.data.replace(/```json\s*|\s*```/g, '');
      try {
        const parsedData = JSON.parse(cleanedData);
        if (validateMealPlanStructure(parsedData)) {
          return {
            success: true,
            data: cleanedData
          };
        } else {
          throw new Error("Invalid meal plan structure after code block removal");
        }
      } catch (error) {
        console.log("Still not valid JSON after removing code blocks");
      }
      
      // Third attempt: Extract JSON pattern
      const jsonMatch = response.data.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const extractedJson = jsonMatch[0];
        try {
          const parsedData = JSON.parse(extractedJson);
          if (validateMealPlanStructure(parsedData)) {
            return {
              success: true,
              data: extractedJson
            };
          } else {
            throw new Error("Invalid meal plan structure in extracted JSON");
          }
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
        const parsedData = JSON.parse(cleanedData);
        if (validateMealPlanStructure(parsedData)) {
          return {
            success: true,
            data: cleanedData
          };
        } else {
          throw new Error("Invalid meal plan structure after syntax fixes");
        }
      } catch (fixErr) {
        console.error("Could not fix JSON formatting:", fixErr);
      }
      
      // Fifth attempt: Generate a fallback meal plan if everything else fails
      try {
        // Generate a fallback meal plan with guaranteed variety
        const fallbackPlan = generateFallbackMealPlan(dailyCalories, days, dietType);
        
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

// Helper function to validate meal plan structure
function validateMealPlanStructure(data: any): boolean {
  // Check if the data has the required fields
  if (!data || typeof data !== 'object') return false;
  if (!('dailyCalories' in data) || !('days' in data)) return false;
  if (!Array.isArray(data.days) || data.days.length === 0) return false;
  
  // Check each day structure
  for (const day of data.days) {
    if (!day.day || !day.meals || !Array.isArray(day.meals) || day.meals.length === 0) {
      return false;
    }
    
    // Check each meal
    for (const meal of day.meals) {
      if (!meal.name || !meal.dish || 
          typeof meal.calories !== 'number' || 
          typeof meal.protein !== 'number' || 
          typeof meal.carbs !== 'number' || 
          typeof meal.fat !== 'number' || 
          !meal.time) {
        return false;
      }
      
      // Ensure alternatives exist and are an array
      if (!meal.alternatives || !Array.isArray(meal.alternatives)) {
        meal.alternatives = generateDefaultAlternatives(meal.dish);
      }
    }
  }
  
  return true;
}

// Generate default alternatives when none are provided
function generateDefaultAlternatives(dish: string): string[] {
  const defaultAlternatives = [
    "Oatmeal with fruits", "Greek yogurt with berries", "Whole grain toast with avocado",
    "Quinoa bowl", "Vegetable wrap", "Lentil soup", "Chickpea salad",
    "Mixed nuts", "Fruit and yogurt", "Protein smoothie",
    "Grilled fish", "Vegetable stir-fry", "Bean chili", "Roasted vegetables"
  ];
  
  // Return a couple random alternatives that aren't the same as the original dish
  return defaultAlternatives
    .filter(alt => alt.toLowerCase() !== dish.toLowerCase())
    .sort(() => Math.random() - 0.5)
    .slice(0, 2);
}

// Generate a complete fallback meal plan with guaranteed variety
function generateFallbackMealPlan(dailyCalories: number, days: number, dietType?: string): any {
  // Different meal options for variety
  const breakfastOptions = [
    "Oatmeal with Fruits", "Scrambled Eggs with Toast", "Greek Yogurt with Berries", 
    "Avocado Toast", "Protein Smoothie Bowl", "Vegetable Omelet", "Whole Grain Pancakes",
    "Chia Seed Pudding", "Breakfast Burrito", "Muesli with Almond Milk"
  ];
  
  const lunchOptions = [
    "Grilled Chicken Salad", "Quinoa Bowl", "Tuna Wrap", "Vegetable Soup with Bread",
    "Lentil Curry with Rice", "Mediterranean Salad", "Falafel Pita", "Bean Burrito",
    "Tofu Stir-Fry", "Pasta Primavera"
  ];
  
  const snackOptions = [
    "Fruit and Nut Mix", "Greek Yogurt", "Protein Bar", "Apple with Peanut Butter",
    "Vegetable Sticks with Hummus", "Trail Mix", "Cottage Cheese with Fruit",
    "Rice Cakes with Avocado", "Edamame", "Boiled Eggs"
  ];
  
  const dinnerOptions = [
    "Baked Salmon with Vegetables", "Chicken Stir-Fry", "Vegetable Pasta", 
    "Black Bean Chili", "Grilled Steak with Sweet Potato", "Tofu and Vegetable Curry",
    "Roasted Chicken with Quinoa", "Fish Tacos", "Stuffed Bell Peppers", "Lentil Shepherd's Pie"
  ];
  
  // Filter options based on diet type
  const filteredBreakfastOptions = dietType === "vegetarian" || dietType === "vegan" 
    ? breakfastOptions.filter(item => !item.includes("Egg") && !item.includes("Scrambled"))
    : breakfastOptions;
    
  const filteredLunchOptions = dietType === "vegetarian" || dietType === "vegan"
    ? lunchOptions.filter(item => !item.includes("Chicken") && !item.includes("Tuna"))
    : lunchOptions;
    
  const filteredDinnerOptions = dietType === "vegetarian" || dietType === "vegan"
    ? dinnerOptions.filter(item => !item.includes("Salmon") && !item.includes("Steak") && !item.includes("Chicken") && !item.includes("Fish"))
    : dinnerOptions;
  
  // Further filter for vegan options
  const veganBreakfastOptions = dietType === "vegan"
    ? filteredBreakfastOptions.filter(item => !item.includes("Yogurt") && !item.includes("Milk") && !item.includes("Cheese"))
    : filteredBreakfastOptions;
    
  const veganSnackOptions = dietType === "vegan"
    ? snackOptions.filter(item => !item.includes("Yogurt") && !item.includes("Cheese") && !item.includes("Egg"))
    : snackOptions;
  
  // Create unique arrays for each meal type
  const breakfasts = dietType === "vegan" ? veganBreakfastOptions : filteredBreakfastOptions;
  const lunches = filteredLunchOptions;
  const snacks = dietType === "vegan" ? veganSnackOptions : snackOptions;
  const dinners = filteredDinnerOptions;
  
  // Ensure we have enough unique options by duplicating and making slight modifications if needed
  const ensureEnoughOptions = (options: string[], needed: number): string[] => {
    const result = [...options];
    while (result.length < needed) {
      // Add variations of existing options
      options.forEach(option => {
        if (result.length < needed) {
          const variation = option.includes("with") 
            ? option.replace(/with.*$/, "with Seasonal Vegetables") 
            : `${option} (Variation)`;
          
          if (!result.includes(variation)) {
            result.push(variation);
          }
        }
      });
    }
    return result;
  };
  
  // Make sure we have enough options for the meal plan
  const shuffledBreakfasts = ensureEnoughOptions(breakfasts, days).sort(() => Math.random() - 0.5);
  const shuffledLunches = ensureEnoughOptions(lunches, days).sort(() => Math.random() - 0.5);
  const shuffledSnacks = ensureEnoughOptions(snacks, days).sort(() => Math.random() - 0.5);
  const shuffledDinners = ensureEnoughOptions(dinners, days).sort(() => Math.random() - 0.5);
  
  // Generate days with unique meals
  const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  
  return {
    dailyCalories: dailyCalories,
    days: Array.from({ length: days }, (_, i) => ({
      day: dayNames[i % 7],
      meals: [
        {
          name: "Breakfast",
          dish: shuffledBreakfasts[i % shuffledBreakfasts.length],
          calories: Math.round(dailyCalories * 0.25),
          protein: 15,
          carbs: 30,
          fat: 10,
          time: "8:00 AM",
          alternatives: [
            shuffledBreakfasts[(i + 1) % shuffledBreakfasts.length],
            shuffledBreakfasts[(i + 2) % shuffledBreakfasts.length]
          ]
        },
        {
          name: "Lunch",
          dish: shuffledLunches[i % shuffledLunches.length],
          calories: Math.round(dailyCalories * 0.35),
          protein: 25,
          carbs: 45,
          fat: 15,
          time: "1:00 PM",
          alternatives: [
            shuffledLunches[(i + 1) % shuffledLunches.length],
            shuffledLunches[(i + 2) % shuffledLunches.length]
          ]
        },
        {
          name: "Snack",
          dish: shuffledSnacks[i % shuffledSnacks.length],
          calories: Math.round(dailyCalories * 0.15),
          protein: 5,
          carbs: 15,
          fat: 10,
          time: "4:00 PM",
          alternatives: [
            shuffledSnacks[(i + 1) % shuffledSnacks.length],
            shuffledSnacks[(i + 2) % shuffledSnacks.length]
          ]
        },
        {
          name: "Dinner",
          dish: shuffledDinners[i % shuffledDinners.length],
          calories: Math.round(dailyCalories * 0.25),
          protein: 20,
          carbs: 30,
          fat: 10,
          time: "8:00 PM",
          alternatives: [
            shuffledDinners[(i + 1) % shuffledDinners.length],
            shuffledDinners[(i + 2) % shuffledDinners.length]
          ]
        }
      ]
    }))
  };
}
