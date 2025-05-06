# MealMitra - AI Meal Plan Generator

MealMitra is an AI-powered meal planning application that creates personalized meal plans based on your dietary preferences, restrictions, and goals.

## Features

- **Personalized Meal Plans**: Generate complete meal plans tailored to your specific needs
- **Dietary Preferences**: Support for various diet types (vegetarian, vegan, etc.)
- **Allergy Considerations**: Exclude ingredients you're allergic to
- **Cuisine Preferences**: Choose your favorite cuisines
- **Calorie Targeting**: Set daily calorie goals
- **PDF Export**: Download your meal plan as a PDF
- **Meal Alternatives**: Each meal includes alternatives for variety

## Quick Start

### Option 1: Using the Setup Scripts (Recommended)

1. Run `setup-gemini-api.bat` to configure your Google Gemini API key
2. Run `start-mealplan.bat` to start the application
3. Open your browser and navigate to http://localhost:3000/meal-planner

### Option 2: Manual Setup

1. Install dependencies: `npm install`
2. Create a `.env` file in the root directory with your Gemini API key:
   ```
   GEMINI_API_KEY=your_key_here
   ```
3. Start the development server: `npm run dev`
4. Open your browser and navigate to http://localhost:3000/meal-planner

## Getting a Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Use this key in the setup process

## Troubleshooting

If you encounter any issues, please check the [Troubleshooting Guide](TROUBLESHOOTING.md) for common solutions.

## How It Works

MealMitra uses Google's Gemini 1.5 Pro AI model to generate personalized meal plans. The application:

1. Takes your preferences (diet type, allergies, etc.)
2. Sends a structured prompt to the Gemini API
3. Processes the response to create a meal plan
4. Ensures meal variety and adherence to your preferences
5. Provides alternatives for each meal

If any issues occur with the API, the application has a robust fallback system to ensure you still get a quality meal plan.

## Technical Requirements

- Node.js (v16 or higher)
- NPM or Yarn
- Modern web browser (Chrome, Firefox, Edge, etc.)
- Internet connection for AI functionality

## License

This project is licensed under the MIT License - see the LICENSE file for details. 