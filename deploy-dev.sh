#!/bin/bash

# run state
docker compose -f docker-compose-stateful.yaml up -d && \
cd k8s && \
kubectl apply -f namespace.yaml && \
kubectl apply -f auth-service/deployment-dev.yaml