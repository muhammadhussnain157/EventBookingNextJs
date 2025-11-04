# ============================================
# EVENT BOOKING APPLICATION DOCKERFILE
# ============================================
# Multi-stage build for optimized Docker image
# This creates a containerized Next.js application

# ============================================
# Stage 1: Dependencies
# Install all Node.js dependencies
# ============================================
FROM node:18-alpine AS deps

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
# --legacy-peer-deps helps resolve dependency conflicts
RUN npm ci --legacy-peer-deps

# ============================================
# Stage 2: Builder
# Build the Next.js application
# ============================================
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy all application files
COPY . .

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

# Build the Next.js application
# This creates optimized production files in .next folder
RUN npm run build

# ============================================
# Stage 3: Runner
# Create the final production image
# ============================================
FROM node:18-alpine AS runner

# Set working directory
WORKDIR /app

# Set to production mode
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Create a non-root user for security best practices
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files from builder stage
COPY --from=builder /app/public ./public

# Copy built application with proper ownership
# Next.js standalone mode creates a minimal server
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch to non-root user for security
USER nextjs

# Expose port 3000 (Next.js default port)
EXPOSE 3000

# Set port environment variable
ENV PORT 3000

# Health check to ensure container is running properly
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

# Start the application
CMD ["node", "server.js"]
