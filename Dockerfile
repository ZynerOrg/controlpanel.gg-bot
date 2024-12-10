# Dependencies
FROM node:20-alpine3.21 AS dependencies

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install

# Build
FROM node:20-alpine3.21 AS build

WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

RUN npx prisma generate && npm run build

# Deploy
FROM node:20-alpine3.20 as deploy

WORKDIR /app

ENV NODE_ENV production

# Add mysql precheck
RUN apk add --no-cache mysql-client
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Copy files
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/dist ./dist

ENTRYPOINT [ "/docker-entrypoint.sh" ]
CMD [ "npm", "run", "start:migrate:prod" ]
