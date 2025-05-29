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
    --build-arg SMTP_SECURE="${SMTP_SECURE}" \
    --build-arg NEXT_PUBLIC_BASE_URL="${NEXT_PUBLIC_BASE_URL}" \
    --build-arg CRON_SECRET="${CRON_SECRET}" \
    --build-arg SCREENSHOT_URLS="${SCREENSHOT_URLS}" \
    --build-arg CHANGE_THRESHOLD="${CHANGE_THRESHOLD}" \
    --build-arg NOTIFICATION_EMAIL="${NOTIFICATION_EMAIL}" \
    --build-arg SCREENSHOT_RETENTION_DAYS="${SCREENSHOT_RETENTION_DAYS}" \
    -t screenshot-diff-app .

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "Docker image built successfully!"
    echo "You can run the container using:"
    echo "docker run -p 3000:3000 -v \$(pwd)/screenshots:/app/public screenshot-diff-app"
else
    echo "Docker build failed!"
fi