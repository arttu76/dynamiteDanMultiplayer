cd common
npm install
npm run build
cd ..

cd backend
npm install
npm run build
cd ..

cd frontend 
npm install
npm run build

cd .. 
DOCKER_BUILDKIT=1 docker build . -t dynamitedanmultiplayer

