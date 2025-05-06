# MealMitra Docker Setup

This guide explains how to run MealMitra using Docker.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) installed on your system
- [Docker Compose](https://docs.docker.com/compose/install/) (included with Docker Desktop for Windows/Mac)

## Quick Start

1. Clone this repository
2. Open a terminal in the project directory
3. Run the application with Docker Compose:

```bash
docker-compose up
```

4. Access the application at http://localhost:3000/meal-planner

## Using Your Own Gemini API Key

You can provide your own Gemini API key in one of two ways:

### Option 1: Environment Variable

```bash
GEMINI_API_KEY=your_key_here docker-compose up
```

### Option 2: Create .env File

Create a file named `.env` in the project root:

```
GEMINI_API_KEY=your_key_here
```

Then run:

```bash
docker-compose up
```

## Building the Docker Image Manually

If you prefer to build and run the Docker image directly without using Docker Compose:

```bash
# Build the image
docker build -t mealmitra .

# Run the container
docker run -p 3000:3000 -e GEMINI_API_KEY=your_key_here mealmitra
```

## Stopping the Application

To stop the application when using Docker Compose:

```bash
# If running in foreground (with docker-compose up)
# Press Ctrl+C

# If running in background (with docker-compose up -d)
docker-compose down
``` 