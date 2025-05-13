# Stage 1: Build the application
FROM node:18-alpine AS builder
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --only=production --ignore-scripts --prefer-offline
# If you have native deps that need build tools:
# RUN apk add --no-cache make gcc g++ python3
# RUN npm install --only=production

COPY . .
RUN npm run build

# Stage 2: Production image
FROM node:18-alpine
WORKDIR /usr/src/app

# Critical: Only copy necessary files from the builder stage
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/package.json ./package.json
# COPY .env.production ./.env # Or better, use environment variables in deployment

# Install pm2 globally if you plan to use it
# RUN npm install pm2 -g

EXPOSE 3000

# CMD ["pm2-runtime", "dist/main.js"]
CMD ["node", "dist/main.js"]