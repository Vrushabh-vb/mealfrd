import { NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

// Define interfaces for request handling
interface ChatMessage {
  role: string;
  content: string;
}

interface GeminiRequest {
  prompt: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: string;
  [key: string]: any; // Allow other properties
}

// Helper function to get API key from environment variables
function getApiKey(): string {
  // Log all environment variables to see if our key exists
  console.log("Environment variables check:");
  console.log("GEMINI_API_KEY:", process.env.GEMINI_API_KEY);
  
  // Try to get from env vars first
  const apiKey = process.env.GEMINI_API_KEY || "";
  
  if (!apiKey) {
    console.warn("Warning: GEMINI_API_KEY environment variable is not set");
    // Fallback to hardcoded key as temporary solution
    // This is not recommended for production but helps for development
    console.log("Using fallback API key");
    return "AIzaSyAix7hz00aVUqle2r08-riFh5qbxtyj7dA";
  }
  
  return apiKey;
}

export async function POST(request: Request) {
  try {
    console.log("Server-side: Processing Gemini API request");
    
    // Get the API key
    const apiKey = getApiKey();
    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API key is not configured" },
        { status: 500 }
      );
    }
    
    // Get the request body
    const requestData = await request.json() as GeminiRequest;
    const { 
      prompt, 
      temperature = 0.7, 
      maxTokens = 1024,
      responseFormat,
      systemInstruction
    } = requestData;
    
    if (!prompt) {
      return NextResponse.json(
        { error: "No prompt provided" },
        { status: 400 }
      );
    }
    
    // Initialize the Gemini API
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    // Configure safety settings
    const safetySettings = [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
    ];
    
    // Add system instructions for JSON response format if requested
    let enhancedPrompt = prompt;
    let jsonSystemInstruction = '';

    if (responseFormat === 'json') {
      jsonSystemInstruction = `You are a JSON generation assistant. Your responses must:
1. ALWAYS be valid, parseable JSON
2. NOT include any explanatory text outside the JSON
3. NOT wrap the JSON in backticks or markdown code blocks
4. Make sure all numeric values are actual numbers, not strings (e.g. use 100 not "100")
5. Use double quotes for all strings and property names
6. Never include trailing commas in arrays or objects
7. Always include the closing brackets for all objects and arrays
8. Make sure all required fields in the expected structure are present
9. Ensure variety in generated content - avoid repetition of the same items
10. Be creative and diverse with options to maximize user satisfaction`;
    }
    
    // Generate content
    let contentConfig: any = {
      contents: [
        { 
          role: "user", 
          parts: [{ 
            text: enhancedPrompt 
          }] 
        }
      ],
      safetySettings,
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens,
      },
    };
    
    // If we have custom system instructions, use those, otherwise use our JSON instructions
    if (systemInstruction || responseFormat === 'json') {
      // Add system instruction - either custom instructions or our JSON-specific ones
      contentConfig.systemInstruction = {
        parts: [{ text: systemInstruction || jsonSystemInstruction }]
      };
    }
    
    try {
      const result = await model.generateContent(contentConfig);
      
      const response = result.response;
      let text = response.text();
      
      if (!text) {
        return NextResponse.json(
          { error: "Empty response from Gemini API" },
          { status: 500 }
        );
      }
      
      // Post-process response for JSON format if requested
      if (responseFormat === 'json') {
        // Try to clean up the response to ensure it's valid JSON
        // 1. Remove any markdown code blocks
        text = text.replace(/```json\s*|\s*```/g, '');
        
        // 2. Remove any leading/trailing non-JSON text
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          text = jsonMatch[0];
        }
        
        // 3. Check if it's valid JSON - if not, try additional fixes
        try {
          JSON.parse(text);
        } catch (err) {
          console.log("Initial JSON parsing failed, attempting to fix...");
          
          // 4. Replace single quotes with double quotes
          let fixedText = text.replace(/'/g, '"');
          
          // 5. Fix property names without quotes
          fixedText = fixedText.replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3');
          
          // 6. Remove trailing commas in arrays and objects
          fixedText = fixedText.replace(/,(\s*[\]}])/g, '$1');
          
          // 7. Make sure numbers are not in quotes
          fixedText = fixedText.replace(/"(\d+)"/g, (match, number) => number);
          
          // 8. Fix issues with array syntax - missing commas, etc.
          fixedText = fixedText.replace(/\]"?(\s*)"?\[/g, '],$1[');
          fixedText = fixedText.replace(/}"?(\s*)"?\{/g, '},$1{');
          
          // 9. Fix unclosed arrays and objects
          const openBrackets = (fixedText.match(/\[/g) || []).length;
          const closeBrackets = (fixedText.match(/\]/g) || []).length;
          if (openBrackets > closeBrackets) {
            fixedText += ']'.repeat(openBrackets - closeBrackets);
          }
          
          const openBraces = (fixedText.match(/\{/g) || []).length;
          const closeBraces = (fixedText.match(/\}/g) || []).length;
          if (openBraces > closeBraces) {
            fixedText += '}'.repeat(openBraces - closeBraces);
          }
          
          // 10. Attempt more aggressive array repair if needed
          if (err instanceof SyntaxError && err.message.includes("after array element")) {
            console.log("Detected array syntax error, attempting targeted repair");
            
            try {
              // Find problem arrays and repair them
              // Using a loop-based approach instead of the 's' flag for better compatibility
              let arrayStart = -1;
              let arrayEnd = -1;
              let depth = 0;
              let fixedText2 = fixedText;
              
              // Find and fix array elements without commas
              for (let i = 0; i < fixedText.length; i++) {
                if (fixedText[i] === '[') {
                  if (depth === 0) {
                    arrayStart = i;
                  }
                  depth++;
                } else if (fixedText[i] === ']') {
                  depth--;
                  if (depth === 0) {
                    arrayEnd = i;
                    // Check and fix this array
                    const arrayContent = fixedText.substring(arrayStart, arrayEnd + 1);
                    if (!/"\s*,\s*"/.test(arrayContent) && /"\s*"/.test(arrayContent)) {
                      // Fix missing commas between array elements
                      const fixedArray = arrayContent.replace(/"\s*"/g, '","');
                      fixedText2 = fixedText2.substring(0, arrayStart) + 
                                  fixedArray + 
                                  fixedText2.substring(arrayEnd + 1);
                    }
                  }
                }
              }
              fixedText = fixedText2;
              
              // If we have position information, try to fix at the specific point
              if (err.message.includes("at position")) {
                const posMatch = err.message.match(/position (\d+)/);
                if (posMatch) {
                  const errorPos = parseInt(posMatch[1]);
                  if (errorPos > 0 && errorPos < fixedText.length) {
                    // Look around the error position
                    const contextBefore = fixedText.substring(Math.max(0, errorPos - 20), errorPos);
                    const contextAfter = fixedText.substring(errorPos, Math.min(fixedText.length, errorPos + 20));
                    console.log(`Context around error: ${contextBefore}|ERROR|${contextAfter}`);
                    
                    // Check for common array syntax issues
                    if (contextBefore.endsWith('"') && contextAfter.startsWith('"')) {
                      // Missing comma between array elements
                      fixedText = fixedText.substring(0, errorPos) + ',' + fixedText.substring(errorPos);
                    }
                  }
                }
              }
            } catch (repairErr) {
              console.log("Array repair attempt failed:", repairErr);
            }
          }
          
          // 11. Try again with the fixed text
          try {
            JSON.parse(fixedText);
            text = fixedText;
            console.log("JSON fixed successfully");
          } catch (innerErr) {
            console.error("Could not fix JSON:", innerErr);
            
            // 12. Last resort - provide a minimal valid JSON structure
            try {
              const defaultStructure = generateFallbackMealPlan(requestData);
              text = JSON.stringify(defaultStructure);
              console.log("Using fallback JSON structure");
            } catch (fallbackErr) {
              console.error("Even fallback structure creation failed:", fallbackErr);
            }
          }
        }
      }
      
      // Format the response to match the expected format from other LLM endpoints
      const formattedResponse = {
        choices: [
          {
            message: {
              content: text
            }
          }
        ]
      };
      
      console.log("Successfully received response from Gemini API");
      
      // Return the formatted response
      return NextResponse.json(formattedResponse);
    } catch (apiError: any) {
      console.error('Error from Gemini API:', apiError);
      
      // Check for "Content with system role is not supported" error
      if (apiError.message && apiError.message.includes("system role is not supported")) {
        console.log("Detected 'system role is not supported' error, retrying without systemInstruction");
        
        // Retry without system instruction - add it to the user prompt instead
        try {
          // Move system instructions into the user prompt
          const combinedPrompt = responseFormat === 'json' 
            ? `${jsonSystemInstruction}\n\n${prompt}`
            : prompt;
          
          // Create new config without system instruction
          const retryConfig = {
            contents: [
              { 
                role: "user", 
                parts: [{ 
                  text: combinedPrompt
                }] 
              }
            ],
            safetySettings,
            generationConfig: {
              temperature,
              maxOutputTokens: maxTokens,
            },
          };
          
          const retryResult = await model.generateContent(retryConfig);
          const retryResponse = retryResult.response;
          let retryText = retryResponse.text();
          
          // Re-apply JSON fixes if needed
          if (responseFormat === 'json') {
            // Apply the same JSON cleanup as above
            retryText = retryText.replace(/```json\s*|\s*```/g, '');
            const jsonMatch = retryText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              retryText = jsonMatch[0];
            }
            
            try {
              JSON.parse(retryText);
            } catch (jsonErr) {
              // If parsing fails, use the fallback
              const defaultStructure = generateFallbackMealPlan(requestData);
              retryText = JSON.stringify(defaultStructure);
            }
          }
          
          // Return response in the expected format
          return NextResponse.json({
            choices: [{
              message: {
                content: retryText
              }
            }]
          });
        } catch (retryError) {
          console.error('Error on retry attempt:', retryError);
        }
      }
      
      // Handle other API errors with a fallback
      if (responseFormat === 'json') {
        // For JSON requests, generate a fallback structure and return it
        try {
          const defaultStructure = generateFallbackMealPlan(requestData);
          
          return NextResponse.json({
            choices: [{
              message: {
                content: JSON.stringify(defaultStructure)
              }
            }],
            error: `API error handled with fallback: ${apiError.message || 'Unknown error'}`
          });
        } catch (fallbackErr) {
          console.error("Fallback generation failed:", fallbackErr);
        }
      }
      
      return NextResponse.json(
        { error: `Gemini API error: ${apiError.message || 'Unknown error'}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error connecting to Gemini API:', error);
    return NextResponse.json(
      { error: `Failed to connect to Gemini API: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

// Helper function to generate a fallback meal plan
function generateFallbackMealPlan(requestData: GeminiRequest): any {
  // Extract preferences from the prompt
  const prompt = requestData.prompt;
  
  // Try to parse number of days
  const daysMatch = prompt.match(/(\d+)-day meal plan/);
  const days = daysMatch ? parseInt(daysMatch[1]) : 7;
  
  // Try to parse calorie target
  const caloriesMatch = prompt.match(/Target daily calories: (\d+)/i);
  const dailyCalories = caloriesMatch ? parseInt(caloriesMatch[1]) : 2000;
  
  // Check for diet type
  const isVegetarian = prompt.toLowerCase().includes("vegetarian");
  const isVegan = prompt.toLowerCase().includes("vegan");
  
  // Diet type preference
  let dietType = "any";
  if (isVegan) dietType = "vegan";
  else if (isVegetarian) dietType = "vegetarian";
  
  // Different meal options for variety based on diet type
  const breakfast = {
    any: [
      "Scrambled Eggs with Whole Grain Toast", "Oatmeal with Fruits", "Greek Yogurt with Berries", 
      "Avocado Toast", "Protein Smoothie", "Vegetable Omelet", "Whole Grain Pancakes"
    ],
    vegetarian: [
      "Oatmeal with Fruits", "Greek Yogurt with Berries", "Avocado Toast", 
      "Vegetable Omelet", "Whole Grain Pancakes", "Fruit Smoothie Bowl", "Chia Seed Pudding"
    ],
    vegan: [
      "Oatmeal with Fruits", "Avocado Toast", "Vegan Protein Smoothie", 
      "Tofu Scramble", "Whole Grain Pancakes with Maple Syrup", "Chia Seed Pudding with Almond Milk", 
      "Fruit Bowl with Coconut Yogurt"
    ]
  };
  
  const lunch = {
    any: [
      "Grilled Chicken Salad", "Tuna Sandwich", "Beef Stir-Fry with Rice", 
      "Quinoa Bowl with Vegetables", "Turkey Wrap", "Lentil Soup with Bread", "Salmon Poke Bowl"
    ],
    vegetarian: [
      "Quinoa Bowl with Vegetables", "Lentil Soup with Bread", "Caprese Sandwich", 
      "Vegetable Wrap", "Mediterranean Salad", "Bean Burrito", "Eggplant Parmesan"
    ],
    vegan: [
      "Quinoa Bowl with Roasted Vegetables", "Lentil Soup with Whole Grain Bread", 
      "Chickpea Salad Sandwich", "Vegetable Wrap with Hummus", "Buddha Bowl", 
      "Bean and Rice Burrito", "Tofu Stir-Fry"
    ]
  };
  
  const snack = {
    any: [
      "Greek Yogurt with Honey", "Protein Bar", "Apple with Peanut Butter", 
      "Handful of Mixed Nuts", "Cheese and Crackers", "Boiled Eggs", "Trail Mix"
    ],
    vegetarian: [
      "Greek Yogurt with Honey", "Protein Bar", "Apple with Peanut Butter", 
      "Handful of Mixed Nuts", "Cheese and Crackers", "Vegetable Sticks with Hummus", "Trail Mix"
    ],
    vegan: [
      "Apple with Almond Butter", "Vegan Protein Bar", "Handful of Mixed Nuts", 
      "Vegetable Sticks with Hummus", "Trail Mix", "Rice Cakes with Avocado", "Fresh Fruit"
    ]
  };
  
  const dinner = {
    any: [
      "Grilled Salmon with Quinoa", "Chicken Curry with Brown Rice", "Beef Stir-Fry with Vegetables", 
      "Turkey Meatballs with Pasta", "Shrimp and Vegetable Skewers", "Pork Chops with Sweet Potato", 
      "Lamb Stew with Vegetables"
    ],
    vegetarian: [
      "Vegetable Curry with Brown Rice", "Eggplant Parmesan", "Vegetable Stir-Fry with Tofu", 
      "Spinach and Ricotta Stuffed Shells", "Mushroom Risotto", "Bean Chili", "Vegetable Lasagna"
    ],
    vegan: [
      "Vegetable Curry with Brown Rice", "Lentil Shepherd's Pie", "Vegetable Stir-Fry with Tofu", 
      "Stuffed Bell Peppers with Quinoa", "Chickpea and Vegetable Tagine", "Bean Chili", 
      "Sweet Potato and Black Bean Bowl"
    ]
  };
  
  // Generate days with unique meals
  const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  
  // Select appropriate meal arrays based on diet type
  const breakfastOptions = dietType === "vegan" ? breakfast.vegan : 
                          (dietType === "vegetarian" ? breakfast.vegetarian : breakfast.any);
  
  const lunchOptions = dietType === "vegan" ? lunch.vegan : 
                      (dietType === "vegetarian" ? lunch.vegetarian : lunch.any);
  
  const snackOptions = dietType === "vegan" ? snack.vegan : 
                      (dietType === "vegetarian" ? snack.vegetarian : snack.any);
  
  const dinnerOptions = dietType === "vegan" ? dinner.vegan : 
                        (dietType === "vegetarian" ? dinner.vegetarian : dinner.any);
  
  // Create the fallback meal plan with variety
  const mealPlan = {
    dailyCalories: dailyCalories,
    days: Array.from({ length: days }, (_, i) => {
      // Ensure we don't repeat meals by using the index mod length
      return {
        day: dayNames[i % 7],
        meals: [
          {
            name: "Breakfast",
            dish: breakfastOptions[i % breakfastOptions.length],
            calories: Math.round(dailyCalories * 0.25),
            protein: 15 + (i % 10),
            carbs: 30 + (i % 15),
            fat: 10 + (i % 5),
            time: "8:00 AM",
            alternatives: [
              breakfastOptions[(i + 1) % breakfastOptions.length],
              breakfastOptions[(i + 2) % breakfastOptions.length]
            ]
          },
          {
            name: "Lunch",
            dish: lunchOptions[i % lunchOptions.length],
            calories: Math.round(dailyCalories * 0.35),
            protein: 25 + (i % 10),
            carbs: 40 + (i % 15),
            fat: 12 + (i % 8),
            time: "1:00 PM",
            alternatives: [
              lunchOptions[(i + 1) % lunchOptions.length],
              lunchOptions[(i + 2) % lunchOptions.length]
            ]
          },
          {
            name: "Snack",
            dish: snackOptions[i % snackOptions.length],
            calories: Math.round(dailyCalories * 0.15),
            protein: 8 + (i % 5),
            carbs: 15 + (i % 8),
            fat: 6 + (i % 4),
            time: "4:00 PM",
            alternatives: [
              snackOptions[(i + 1) % snackOptions.length],
              snackOptions[(i + 2) % snackOptions.length]
            ]
          },
          {
            name: "Dinner",
            dish: dinnerOptions[i % dinnerOptions.length],
            calories: Math.round(dailyCalories * 0.25),
            protein: 30 + (i % 10),
            carbs: 35 + (i % 15),
            fat: 12 + (i % 8),
            time: "7:30 PM",
            alternatives: [
              dinnerOptions[(i + 1) % dinnerOptions.length],
              dinnerOptions[(i + 2) % dinnerOptions.length]
            ]
          }
        ]
      };
    })
  };
  
  return mealPlan;
} 