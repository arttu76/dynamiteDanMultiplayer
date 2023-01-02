
# Dynamite Dan Multiplayer

## How to build if you have nodejs and npm:

    cd frontend
    npm install
    npm run build

## How to build if you nothing but docker:

    cd frontend
    ./buildWithDocker.sh

## What to do with the build:
Open `frontend/dist/index.html`in your brower.

## Development build
If you want to do a development build which automatically updates components when you modify the code, do:
 `cd frontend
 npm install
 npm run devServe`

## TODO
### Frontend
 - fix walking
 - walking on ladders
 - walking on trampolines
 - fix too few animation frames parsed from rom
 - backend socketjs integration
 - enemy collisions / dead enemies
 - teleporter
 - elevator
 - lasers
 - rudimentary chat
### Backend
 - only everything :)

