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
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

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
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-root user for security best practices
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy public folder from builder
COPY --from=builder /app/public ./public

# Copy package.json
COPY --from=builder /app/package.json ./package.json

# Copy built application with proper ownership
# Next.js standalone mode creates a minimal server
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch to non-root user for security
USER nextjs

# Expose port 3000 (Next.js default port)
EXPOSE 3000

# Set port environment variable
ENV PORT=3000

# Start the application
CMD ["node", "server.js"]
