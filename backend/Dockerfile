FROM blobgame:base

WORKDIR /blob-game/backend

RUN yarn build

# create logs folder
RUN mkdir ./logs

# server runs on 4000
EXPOSE 4000

CMD ["node", "dist/index.js", "--port", "4000"]