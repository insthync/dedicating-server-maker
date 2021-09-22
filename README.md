# dedicating-server-match-maker
Try to make match maker and game-server orchestrator by using Colyseus

## How it work?
- When players press start game it will run executable file with parameters such as game mode, map, max players, listening port and so on.
- Then the executable file (game-server) read the parameters then load map/start game then tell the match maker that is it ready.
- Game-server may have to tell the match maker that it is still running.
