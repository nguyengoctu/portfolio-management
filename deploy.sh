#!/bin/bash

# run state
docker compose -f docker-compose-stateful.yaml up -d && \
cd k8s && \
kubectl apply -f namespace.yaml && \
kubectl create secret generic db-credentials \
--from-literal=username=user \
--from-literal=password=password \
-n portfolio-management