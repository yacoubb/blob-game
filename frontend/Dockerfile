FROM blobgame:base

RUN echo $NODE_ENV

WORKDIR /blob-game/frontend

# react doesn't let us override node env so we use a custom name
RUN REACT_APP_NODE_ENV=$NODE_ENV yarn build

# server runs on 3000
EXPOSE 3000

CMD ["node", "serve.js", "--port", "3000"]