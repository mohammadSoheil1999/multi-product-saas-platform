FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY migrations ./migrations
COPY src ./src
USER node
EXPOSE 5185
CMD ["node","src/server.js"]
