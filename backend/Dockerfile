FROM node:20-alpine

WORKDIR /app

# Copy root package.json (dependencies are in root)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy backend code
COPY backend/ ./

# Expose port
EXPOSE 8493

# Start the server
CMD ["node", "server.js"]

