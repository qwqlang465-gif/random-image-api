FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .
RUN mkdir -p /app/public/images && chown -R node:node /app

USER node

EXPOSE 3000
CMD ["npm", "start"]
