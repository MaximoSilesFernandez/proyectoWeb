FROM node:24-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . ./
EXPOSE 5173
CMD ["npm", "run", "dev"]
