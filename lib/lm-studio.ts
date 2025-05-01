// Recipe generation with Google Gemini API integration

// Response interface for type safety
interface LMStudioResponse {
  success: boolean;
  data?: string;
  error?: string | null;
}

// Query the Gemini API through our server-side proxy
export async function queryLMStudio(prompt: string): Promise<LMStudioResponse> {
  try {
    console.log("Connecting to Gemini API via server-side API route");
    
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt,
        temperature: 0.7,
        maxTokens: 1024
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
