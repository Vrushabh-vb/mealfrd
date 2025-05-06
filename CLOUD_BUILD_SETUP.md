# Setting Up Google Cloud Build for MealMitra

This guide explains how to set up continuous integration and deployment for MealMitra using Google Cloud Build.

## Prerequisites

1. A Google Cloud Platform account
2. GitHub repository with your MealMitra code
3. Google Cloud project with billing enabled
4. Required APIs enabled:
   - Cloud Build API
   - Container Registry API
   - Cloud Run API (if deploying to Cloud Run)

## Setup Steps

### 1. Enable Required APIs

In the Google Cloud Console:
1. Go to "APIs & Services" > "Library"
2. Search for and enable:
   - Cloud Build API
   - Container Registry API
   - Cloud Run API

### 2. Connect Your GitHub Repository

1. In the Google Cloud Console, go to "Cloud Build" > "Triggers"
2. Click "Connect Repository"
3. Select "GitHub (Cloud Build GitHub App)"
4. Follow the prompts to authenticate with GitHub
5. Select your MealMitra repository

### 3. Create a Build Trigger

1. Click "Create Trigger"
2. Name your trigger (e.g., "mealmitra-build")
3. Choose the event to trigger the build (e.g., "Push to a branch")
4. Specify the branch (e.g., "^main$" for only the main branch)
5. Under "Configuration", select "Cloud Build configuration file (yaml or json)"
6. Set "Location" to "Repository" and path to "cloudbuild.yaml"
7. Under "Substitution variables", add:
   - Name: `_GEMINI_API_KEY`
   - Value: Your Gemini API key (or leave default)
8. Click "Create"

### 4. Verify the Setup

1. Make a commit and push to your repository
2. Go to "Cloud Build" > "History" to see if your build starts
3. Once complete, check "Cloud Run" to see your deployed service (if deploying to Cloud Run)

## Customizing the Build

The `cloudbuild.yaml` file can be modified to:
- Change the deployment target (Kubernetes, Compute Engine, etc.)
- Add testing steps
- Configure different environment variables
- Adjust build timeouts

## Troubleshooting

If your build fails:
1. Check the build logs for specific errors
2. Ensure all required APIs are enabled
3. Verify that your Dockerfile builds successfully locally
4. Check that your service account has the necessary permissions 