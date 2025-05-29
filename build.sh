#!/bin/bash

# Check if .env file exists
if [ -f .env ]; then
    echo "Loading environment variables from .env file..."
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "No .env file found. Please make sure all required environment variables are set."
fi

# Build the Docker image
docker build \
    --build-arg SMTP_HOST="${SMTP_HOST}" \
    --build-arg SMTP_PORT="${SMTP_PORT}" \
    --build-arg SMTP_USER="${SMTP_USER}" \
    --build-arg SMTP_PASS="${SMTP_PASS}" \
    --build-arg SMTP_FROM="${SMTP_FROM}" \
    --build-arg SMTP_TO="${SMTP_TO}" \
    --build-arg NEXT_PUBLIC_BASE_URL="${NEXT_PUBLIC_BASE_URL}" \
    --build-arg CRON_SECRET="${CRON_SECRET}" \
    -t screenshot-diff-app .

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "Docker image built successfully!"
    echo "You can run the container using:"
    echo "docker run -p 3000:3000 -v \$(pwd)/screenshots:/app/screenshots screenshot-diff-app"
else
    echo "Docker build failed!"
fi