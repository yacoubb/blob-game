#!/usr/bin/env bash

docker build -t blobgame:base --build-arg NODE_ENV=$NODE_ENV  .
docker compose build

docker compose up