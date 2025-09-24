# Use official Node.js 18 runtime
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (production only)
RUN npm ci --omit=dev --no-audit --no-fund

# Copy application code
COPY . .

# Expose port (Railway will set PORT env var)
EXPOSE 3000

# Start the application
CMD ["node", "server.js"]