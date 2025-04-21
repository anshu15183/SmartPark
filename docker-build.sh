
#!/bin/bash

# Get the current date and time for tagging
TAG=$(date +"%Y%m%d%H%M")

# Docker Hub username (change this to your Docker Hub username)
DOCKER_USERNAME="yourusername"
# Repository name
REPO_NAME="smartpark"

# Step 1: Build the Docker image
echo "Building Docker image..."
docker build -t $DOCKER_USERNAME/$REPO_NAME:$TAG -t $DOCKER_USERNAME/$REPO_NAME:latest .

# Step 2: Push the Docker image to Docker Hub
echo "Pushing Docker image to Docker Hub..."
docker push $DOCKER_USERNAME/$REPO_NAME:$TAG
docker push $DOCKER_USERNAME/$REPO_NAME:latest

echo "Done! Your image is now available at: $DOCKER_USERNAME/$REPO_NAME:$TAG"
echo "You can pull it using: docker pull $DOCKER_USERNAME/$REPO_NAME:latest"
