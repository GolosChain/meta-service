FROM node:10
WORKDIR /app
COPY ./package*.json ./
RUN npm install --only=production
COPY ./src/ ./src
CMD ["node", "./src/index.js"]
