FROM alpine:3.14

RUN apk add --no-cache nodejs npm

ADD common /dynamitedanmultiplayer/common

WORKDIR /dynamitedanmultiplayer/backend
ADD backend/package.json backend/package-lock.json ./
ADD backend/dist dist
RUN npm ci && chmod 777 /dynamitedanmultiplayer/backend/dist/server.js

ADD frontend/dist /dynamitedanmultiplayer/frontend/dist

ENTRYPOINT [ "sh", "-c", "node /dynamitedanmultiplayer/backend/dist/server.js" ]
