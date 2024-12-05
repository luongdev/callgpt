FROM node:20-alpine as base

WORKDIR /app

ENV NODE_ENV="production"


FROM base as build

RUN #apk add build-essential pkg-config python-is-python3

COPY --link package-lock.json package.json ./
RUN npm ci

COPY --link . .


FROM base

COPY --from=build /app /app

ENV VOICE_MODEL "aura-asteria-en"
ENV OPENAI_API_KEY ""
ENV DEEPGRAM_API_KEY ""

EXPOSE 3000
CMD [ "node", "app.js" ]
