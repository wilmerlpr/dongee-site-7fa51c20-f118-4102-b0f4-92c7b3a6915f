
FROM node:20-alpine
WORKDIR /app

# Copy dependency definitions
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build
RUN npm run build
RUN npm install -g serve

# Serve
CMD ["serve", "-s", "dist", "-l", "3000"]
EXPOSE 3000
