FROM node:24-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . ./
EXPOSE 3000
CMD ["node", "./backend.ts"]