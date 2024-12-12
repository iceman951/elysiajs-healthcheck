FROM oven/bun:1.1.38-alpine
WORKDIR /app

COPY .env .
COPY package.json .
COPY bun.lockb .

RUN bun install

COPY src src
COPY tsconfig.json .

ENV NODE_ENV=production
CMD ["bun", "src/index.ts"]

EXPOSE 8666