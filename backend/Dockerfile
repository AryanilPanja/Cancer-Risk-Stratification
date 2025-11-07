FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies (only production)
COPY package*.json ./
RUN npm install --production

# Copy app sources
COPY . .

ENV NODE_ENV=production
EXPOSE 5001

CMD ["node", "src/server.js"]
