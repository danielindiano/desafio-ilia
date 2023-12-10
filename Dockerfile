#Development Stage
FROM node:20-alpine as development

ARG PORT=3000
ENV PORT=${PORT}
ENV NODE_ENV development

WORKDIR /app

COPY ./package*.json ./
RUN npm ci

COPY . .

CMD ["npm", "run", "start:dev"]

#Builder Stage
FROM node:20-alpine as builder

ARG PORT
ENV PORT=${PORT}
ENV NODE_ENV build

WORKDIR /app

COPY --from=development /app ./

RUN npm run build

#Runner Stage
FROM node:20-alpine as production

ENV NODE_ENV production

ARG PORT=80
ENV PORT=${PORT}

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

EXPOSE ${PORT}

CMD ["node", "dist/main.js"]