FROM node:14.19

RUN apt-get update

WORKDIR /blob-game/


COPY package.json  ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/
COPY gameserver/package.json ./gameserver/

RUN yarn

COPY . .
RUN find /blob-game/ > /blob-game/find.log

ARG NODE_ENV
ENV NODE_ENV ${NODE_ENV}

RUN yarn sync-gql