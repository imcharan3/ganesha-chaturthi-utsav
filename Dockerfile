# Use official Node.js LTS lightweight image
FROM node:20-alpine AS build

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy project files
COPY . .

# Build Vite frontend bundle
RUN npm run build

# Production runtime stage
FROM node:20-alpine AS runtime

WORKDIR /app

# Set node environment
ENV NODE_ENV=production
ENV PORT=5000

# Copy package files and install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy server code and build output from build stage
COPY --from=build /app/server ./server
COPY --from=build /app/dist ./dist

# Create uploads directory
RUN mkdir -p server/uploads

# Expose port
EXPOSE 5000

# Start unified Node.js express & socket server
CMD ["node", "server/server.js"]
