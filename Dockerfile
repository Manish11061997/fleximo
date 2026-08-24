# Production Dockerfile for Fleximo
FROM node:20-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=5050

# Install production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application files
COPY . .

# Ensure data directory exists
RUN mkdir -p /app/data /app/data/uploaded_resumes

# Expose port
EXPOSE 5050

# Run with non-root node user
USER node

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5050/health || exit 1

# Start server
CMD ["node", "server.js"]
