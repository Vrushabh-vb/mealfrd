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
4. Make sure all numeric values are actual numbers, not strings
5. Use double quotes for all strings and property names
6. Never include trailing commas in arrays or objects`;
    }
    
    // Generate content
    const result = await model.generateContent({
      contents: [
        ...(systemInstruction ? [{ role: "system", parts: [{ text: systemInstruction }] }] : []),
        { role: "user", parts: [{ text: enhancedPrompt }] }
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
      // Remove any markdown code blocks
      text = text.replace(/```json\s*|\s*```/g, '');
      
      // Check if it's valid JSON - if not, try to extract it
      try {
        JSON.parse(text);
      } catch (err) {
        // Try to extract JSON if embedded in other text
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          text = jsonMatch[0];
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