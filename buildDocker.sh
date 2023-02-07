cd backend
npm install
npm run build

cd ../frontend 
npm install
npm run build

cd .. 
DOCKER_BUILDKIT=1 docker build . -t dynamitedanmultiplayer

