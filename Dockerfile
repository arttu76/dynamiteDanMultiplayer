FROM alpine:3.14

RUN apk add --no-cache nodejs npm && npm install -g supervisor

ADD common /dynamitedanmultiplayer/common

WORKDIR /dynamitedanmultiplayer/backend
ADD backend/package.json backend/package-lock.json ./
ADD backend/dist dist
RUN npm ci

ADD frontend/dist /dynamitedanmultiplayer/frontend/dist

ENTRYPOINT [ "/dynamitedanmultiplayer/backend/node_modules/pm2/bin/pm2-runtime", "/dynamitedanmultiplayer/backend/dist/server.js" ]
