# --- Stage 1: Build the frontend React app ---
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# --- Stage 2: Run the Node.js TypeScript backend ---
FROM node:18-alpine
WORKDIR /app

# Copy backend dependencies and install
COPY package*.json ./
RUN npm install

# Copy backend source code and config
COPY . .

# Copy the built frontend from Stage 1 into the backend's static directory
COPY --from=frontend-builder /app/public ./public

# Expose the server port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Start backend using tsx
CMD ["npm", "start"]