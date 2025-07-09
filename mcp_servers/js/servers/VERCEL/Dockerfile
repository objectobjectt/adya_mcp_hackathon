FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY src/ ./src/

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S vercel -u 1001

# Change ownership
RUN chown -R vercel:nodejs /app
USER vercel

# Expose port (if needed for HTTP mode)
EXPOSE 3000

# Set environment
ENV NODE_ENV=production

# Start the server
CMD ["node", "src/index.js"]
