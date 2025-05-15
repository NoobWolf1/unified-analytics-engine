# Stage 1: Build the application
FROM node:20-alpine AS builder
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install # ❗ Install all deps including devDependencies

COPY . .
RUN npm run build

# Stage 2: Production image
FROM node:18-alpine
WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/package.json ./package.json

EXPOSE 3000

CMD ["node", "dist/main.js"]
