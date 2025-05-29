# Use Node.js LTS version as the base image
FROM node:20-slim

# Set working directory
WORKDIR /app

# Install tini for proper signal handling and system dependencies required for Playwright
RUN apt-get update && apt-get install -y \
    tini \
    libglib2.0-0 \
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libdbus-1-3 \
    libxcb1 \
    libxkbcommon0 \
    libx11-6 \
    libxcomposite1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libpango-1.0-0 \
    libcairo2 \
    libasound2 \
    && rm -rf /var/lib/apt/lists/*

# Define build arguments for environment variables
ARG SMTP_HOST
ARG SMTP_PORT
ARG SMTP_USER
ARG SMTP_PASS
ARG SMTP_FROM
ARG SMTP_TO
ARG NEXT_PUBLIC_BASE_URL
ARG CRON_SECRET

# Set environment variables from build arguments
ENV SMTP_HOST=$SMTP_HOST
ENV SMTP_PORT=$SMTP_PORT
ENV SMTP_USER=$SMTP_USER
ENV SMTP_PASS=$SMTP_PASS
ENV SMTP_FROM=$SMTP_FROM
ENV SMTP_TO=$SMTP_TO
ENV NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL
ENV CRON_SECRET=$CRON_SECRET

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Install Playwright browsers
RUN npx playwright install chromium

# Copy the rest of the application
COPY . .

# Set proper permissions
RUN chown -R node:node /app

# Switch to non-root user
USER node

# Build the Next.js application
RUN npm run build

# Expose the port the app runs on
EXPOSE 3000

# Use tini as the entrypoint
ENTRYPOINT ["/usr/bin/tini", "--"]

# Start the application with proper signal handling
CMD ["node", "server.js"]