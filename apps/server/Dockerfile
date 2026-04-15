FROM node:22-alpine AS base
WORKDIR /app

FROM base AS builder
COPY package*.json ./
RUN npm install

FROM base AS runner
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY src ./src
COPY package*.json ./
EXPOSE 5000
CMD ["node", "src/index.js"]
