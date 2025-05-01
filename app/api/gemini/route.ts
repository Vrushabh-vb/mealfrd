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
    const { prompt, temperature = 0.7, maxTokens = 1024 } = requestData;
    
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
    
    // Generate content
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      safetySettings,
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens,
      },
    });
    
    const response = result.response;
    const text = response.text();
    
    if (!text) {
      return NextResponse.json(
        { error: "Empty response from Gemini API" },
        { status: 500 }
      );
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