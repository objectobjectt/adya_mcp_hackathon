# Stage 1: Build
FROM node:18-alpine

WORKDIR /app

# Install dependencies efficiently
# COPY package*.json tsconfig.json ./
# COPY servers/ ./servers/
COPY . .

RUN npm run install:all
RUN npm run build:all

EXPOSE 5000

CMD ["npm", "run", "dev:client"]