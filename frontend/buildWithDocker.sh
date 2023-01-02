#!/bin/bash
docker run --rm --name frontendCompilation -v $(pwd):/compile node:18.12.1-bullseye /bin/bash -c "cd /compile && npm install && npm run build"

