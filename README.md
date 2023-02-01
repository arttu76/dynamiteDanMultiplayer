
# Dynamite Dan Multiplayer

## Frontend

The frontend communicates with socket.io server assumed to be located in port 1000 on localhost.

Both frontend and backend TypeScript implementation share some interfaces. Those common interfaces are defined in /commonTypes.ts file. Both frontend and backend "projects" include the same file. 

### How to build if you have nodejs and npm:

    cd frontend
    npm install
    npm run build

### How to build if you nothing but docker:

    cd frontend
    ./buildWithDocker.sh

### What to do with the build:
Open `frontend/dist/index.html`in your browser. Use arrow keys to move (once movement collision detection has been fixed) and wasd-keys to change rooms (debug feature).

### Development build
If you want to do a development build which automatically updates components when you modify the code, do:
 `cd frontend
 npm install
 npm run devServe`

## Backend
### How to build the placeholder backend nodejs server if you have nodejs and npm:

    cd backend
    npm install
    npm run build

To run it, do:

    cd backend
    node dist/server.js

To run the server in development mode, do:

    cd backend
    npm run dev

## TODO
### Frontend
 - walking on trampolines
 - fix too few animation frames parsed from rom
 - lasers
 - make it actually look like something (=less ugly)
 - name/rename players
### Backend
 - backend with golang
