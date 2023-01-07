
# Dynamite Dan Multiplayer

## How to build if you have nodejs and npm:

    cd frontend
    npm install
    npm run build

## How to build if you nothing but docker:

    cd frontend
    ./buildWithDocker.sh

## What to do with the build:
Open `frontend/dist/index.html`in your browser. Use arrow keys to move (once movement collision detection has been fixed) and wasd-keys to change rooms (debug feature).

## Development build
If you want to do a development build which automatically updates components when you modify the code, do:
 `cd frontend
 npm install
 npm run devServe`

## TODO
### Frontend
 - fix walking (glitches because it is pixel perfect, it should not be)
 - walking on ladders
 - walking on trampolines
 - fix too few animation frames parsed from rom
 - backend socketjs integration
 - teleporter functionality
 - elevator
 - lasers
 - rudimentary chat
### Backend
 - only everything :)

