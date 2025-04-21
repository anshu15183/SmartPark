
# ---- Base Node ----
FROM node:20-alpine AS base
WORKDIR /app
# Install dependencies for both client and server
COPY package*.json ./
COPY server/package*.json ./server/

# ---- Dependencies ----
FROM base AS dependencies
# Install server dependencies
WORKDIR /app/server
RUN npm ci --only=production
# Install client dependencies
WORKDIR /app
RUN npm ci --only=production

# ---- Build ----
FROM base AS build
# Copy server dependency files from the dependencies stage
COPY --from=dependencies /app/server/node_modules ./server/node_modules
# Copy all project files
COPY . .
# Build client
RUN npm run build

# ---- Production ----
FROM node:20-alpine AS production
WORKDIR /app

# Copy production node_modules from dependencies stage
COPY --from=dependencies /app/server/node_modules ./server/node_modules
# Copy built client from build stage
COPY --from=build /app/dist ./dist
# Copy server files
COPY --from=build /app/server ./server
# Copy necessary files for running the app
COPY --from=build /app/package.json ./

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000
# Use environment variable for MongoDB URI with a fallback
ENV MONGODB_URI=mongodb://mongodb:27017/smartpark
ENV JWT_SECRET=your_jwt_secret_key_change_in_production
ENV FRONTEND_URL=http://localhost:5000

# Expose the port the server uses
EXPOSE 5000

# Add a startup script that checks for MongoDB Atlas connection
COPY --from=build /app/server/startup.sh ./
RUN chmod +x ./startup.sh

# Start the server with the startup script
CMD ["./startup.sh"]
