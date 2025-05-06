# Use Node.js 20 as the base image (based on the engine requirements)
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the code
COPY . .

# Create a .env file with default API key
RUN echo "GEMINI_API_KEY=AIzaSyAix7hz00aVUqle2r08-riFh5qbxtyj7dA" > .env

# Set environment variables
ENV NODE_OPTIONS=--no-deprecation
ENV NEXT_TELEMETRY_DISABLED=1

# Build the application
RUN npm run build

# Expose the port the app will run on
EXPOSE 3000

# Command to run the application
CMD ["npm", "start"] 