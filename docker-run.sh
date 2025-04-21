
#!/bin/bash

# Docker Hub username (change this to your Docker Hub username)
DOCKER_USERNAME="yourusername"
# Repository name
REPO_NAME="smartpark"

# Step 1: Pull the latest Docker image
echo "Pulling latest Docker image from Docker Hub..."
docker pull $DOCKER_USERNAME/$REPO_NAME:latest

# Step 2: Stop and remove any existing container
echo "Stopping any existing container..."
docker stop smartpark-app || true
docker rm smartpark-app || true

# Step 3: Check if MONGODB_URI is set in environment
if [ -z "$MONGODB_URI" ]; then
  echo "MONGODB_URI environment variable not set."
  echo "To use MongoDB Atlas, run with: MONGODB_URI='mongodb+srv://user:password@cluster.mongodb.net/smartpark' ./docker-run.sh"
  echo "Using local MongoDB container instead."
  
  # Run Docker Compose with local MongoDB
  echo "Starting containers with Docker Compose (local MongoDB)..."
  docker-compose up -d
else
  # Run only the app container with external MongoDB
  echo "Starting app with MongoDB Atlas connection: $MONGODB_URI"
  docker-compose up -d app
fi

echo "SmartPark application is now running on http://localhost:5000"
echo "To view logs, use: docker-compose logs -f"
echo "To stop the application, use: docker-compose down"
