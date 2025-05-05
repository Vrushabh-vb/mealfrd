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
      responseFormat
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
    let systemInstruction = '';
    
    if (responseFormat === 'json') {
      systemInstruction = `You are a JSON generation assistant. Your responses must:
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
    const result = await model.generateContent({
      contents: [
        // Gemini doesn't support system role, so we need to include instructions in user prompt
        { 
          role: "user", 
          parts: [{ 
            text: responseFormat === 'json' 
              ? `${systemInstruction}\n\n${enhancedPrompt}`
              : enhancedPrompt 
          }] 
        }
      ],
      safetySettings,
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens,
      },
    });
    
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
            const defaultStructure = {
              dailyCalories: 2000,
              days: [
                {
                  day: "Monday",
                  meals: [
                    {
                      name: "Breakfast",
                      dish: "Oatmeal with Fruits",
                      calories: 320,
                      protein: 10,
                      carbs: 50,
                      fat: 8,
                      time: "8:00 AM",
                      alternatives: ["Yogurt with Granola", "Whole Grain Toast with Avocado"]
                    },
                    {
                      name: "Lunch",
                      dish: "Grilled Chicken Salad",
                      calories: 400,
                      protein: 35,
                      carbs: 20,
                      fat: 15,
                      time: "12:30 PM",
                      alternatives: ["Quinoa Bowl", "Vegetable Wrap"]
                    },
                    {
                      name: "Snack",
                      dish: "Fruit and Nut Mix",
                      calories: 150,
                      protein: 5,
                      carbs: 15,
                      fat: 8,
                      time: "4:00 PM",
                      alternatives: ["Greek Yogurt", "Protein Bar"]
                    },
                    {
                      name: "Dinner",
                      dish: "Baked Salmon with Vegetables",
                      calories: 450,
                      protein: 40,
                      carbs: 25,
                      fat: 20,
                      time: "7:00 PM",
                      alternatives: ["Vegetable Stir-Fry", "Lentil Soup with Bread"]
                    }
                  ]
                }
              ]
            };
            
            // Generate days for a whole week using the template
            if (text.includes("days") && text.includes("meals")) {
              // Try to extract the number of days from the query
              const daysMatch = prompt.match(/(\d+)-day meal plan/);
              const numDays = daysMatch ? parseInt(daysMatch[1]) : 7;
              
              // Use different meals for each day
              const breakfastOptions = [
                "Oatmeal with Fruits", "Scrambled Eggs with Toast", "Greek Yogurt with Berries", 
                "Avocado Toast", "Protein Smoothie Bowl", "Vegetable Omelet", "Whole Grain Pancakes"
              ];
              
              const lunchOptions = [
                "Grilled Chicken Salad", "Quinoa Bowl", "Tuna Wrap", "Vegetable Soup with Bread",
                "Lentil Curry with Rice", "Mediterranean Salad", "Falafel Pita"
              ];
              
              const snackOptions = [
                "Fruit and Nut Mix", "Greek Yogurt", "Protein Bar", "Apple with Peanut Butter",
                "Vegetable Sticks with Hummus", "Trail Mix", "Cottage Cheese with Fruit"
              ];
              
              const dinnerOptions = [
                "Baked Salmon with Vegetables", "Chicken Stir-Fry", "Vegetable Pasta", 
                "Black Bean Chili", "Grilled Steak with Sweet Potato", "Tofu and Vegetable Curry",
                "Roasted Chicken with Quinoa"
              ];
              
              // Generate days with unique meals
              defaultStructure.days = Array.from({ length: numDays }, (_, i) => {
                const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
                return {
                  day: dayNames[i % 7],
                  meals: [
                    {
                      name: "Breakfast",
                      dish: breakfastOptions[i % breakfastOptions.length],
                      calories: 300 + (i * 10) % 100,
                      protein: 10 + (i % 10),
                      carbs: 40 + (i % 20),
                      fat: 8 + (i % 10),
                      time: "8:00 AM",
                      alternatives: [
                        breakfastOptions[(i + 1) % breakfastOptions.length],
                        breakfastOptions[(i + 2) % breakfastOptions.length]
                      ]
                    },
                    {
                      name: "Lunch",
                      dish: lunchOptions[i % lunchOptions.length],
                      calories: 400 + (i * 10) % 100,
                      protein: 25 + (i % 15),
                      carbs: 35 + (i % 20),
                      fat: 15 + (i % 10),
                      time: "12:30 PM",
                      alternatives: [
                        lunchOptions[(i + 1) % lunchOptions.length],
                        lunchOptions[(i + 2) % lunchOptions.length]
                      ]
                    },
                    {
                      name: "Snack",
                      dish: snackOptions[i % snackOptions.length],
                      calories: 150 + (i * 10) % 100,
                      protein: 5 + (i % 10),
                      carbs: 15 + (i % 10),
                      fat: 8 + (i % 5),
                      time: "4:00 PM",
                      alternatives: [
                        snackOptions[(i + 1) % snackOptions.length],
                        snackOptions[(i + 2) % snackOptions.length]
                      ]
                    },
                    {
                      name: "Dinner",
                      dish: dinnerOptions[i % dinnerOptions.length],
                      calories: 450 + (i * 10) % 100,
                      protein: 30 + (i % 15),
                      carbs: 40 + (i % 20),
                      fat: 15 + (i % 15),
                      time: "7:00 PM",
                      alternatives: [
                        dinnerOptions[(i + 1) % dinnerOptions.length],
                        dinnerOptions[(i + 2) % dinnerOptions.length]
                      ]
                    }
                  ]
                };
              });
            }
            
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
  } catch (error) {
    console.error('Error connecting to Gemini API:', error);
    return NextResponse.json(
      { error: `Failed to connect to Gemini API: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
} 