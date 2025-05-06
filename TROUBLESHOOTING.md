# MealMitra Troubleshooting Guide

This guide helps you troubleshoot common issues with the MealMitra AI Meal Plan Generator.

## Common Issues

### "Could not process the meal plan data" Error

This error occurs when the application cannot parse the JSON response from the Gemini API.

**Fixes:**
1. Run `setup-gemini-api.bat` and choose option 1 to set up your own API key
2. Make sure your API key is valid and has access to the Gemini 1.5 Pro model
3. If the error persists, the application will automatically use a fallback meal plan

### "Content with system role is not supported" Error

This error happens when the Gemini API rejects the system instructions format.

**Fixes:**
1. The application already includes a fix that modifies how system instructions are sent
2. If you still see this error, run `start-mealplan.bat` which configures the correct environment

### No meals are displayed or empty meal plan

This can happen when there's a connection issue or when the API response is invalid.

**Fixes:**
1. Check your internet connection
2. Verify your API key is correct by running `setup-gemini-api.bat` and choosing option 3
3. Try refreshing the page or selecting different meal preferences

### Application won't start or crashes

This typically happens due to dependency issues or Node.js version conflicts.

**Fixes:**
1. Make sure you have Node.js installed (version 16.x or higher recommended)
2. Run `npm install` to ensure all dependencies are installed
3. Use `start-mealplan.bat` which sets up the correct environment variables

## API Key Setup

To use your own Google Gemini API key:

1. Get a free API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Run `setup-gemini-api.bat` and select option 1
3. Enter your API key when prompted

## Environment Variables

The application requires the following environment variable:

- `GEMINI_API_KEY`: Your Google Gemini API key

You can set this in any of these ways:
1. Using `setup-gemini-api.bat` (recommended)
2. Creating a `.env` file with `GEMINI_API_KEY=your_key_here`
3. Setting it in your system environment variables

## Meal Plan Generation Issues

If you're having trouble with meal plan generation:

1. Try selecting fewer preferences or restrictions
2. Use a simpler diet type (like "any" instead of specific diets)
3. Reduce the number of days in the meal plan

## Performance Improvements

For better performance:

1. Use Chrome or Edge browser for the best experience
2. Close other applications to free up system resources
3. Use a default meal plan with fewer days if your system is slow

## Contact Support

If you continue to experience issues:

1. Check the console log in your browser's developer tools
2. Note any error messages
3. Contact support with these details 