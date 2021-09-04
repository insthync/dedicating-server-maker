import Arena from "@colyseus/arena";
import { monitor } from "@colyseus/monitor";

/**
 * Import your Room files
 */
import { LobbyRoom } from "./rooms/LobbyRoom";
import * as lobbyRoomList from "./rooms/LobbyRoomList";

export default Arena({
    getId: () => "Your Colyseus App",

    initializeGameServer: (gameServer) => {
        /**
         * Define your room handlers:
         */
        gameServer.define('lobby', LobbyRoom);

    },

    initializeExpress: (app) => {
        /**
         * Bind your custom express routes here:
         */
        app.get("/", (req, res) => {
            res.send("It's time to kick ass and chew bubblegum!");
        });


        app.get("/:roomId", (req, res) => {
            const roomId = req.params.roomId;
            if (!lobbyRoomList.has(roomId)) {
                res.status(404).send();
                return;
            }
            res.status(200).send(JSON.stringify(lobbyRoomList.get(roomId).getInfo()));
        });

        app.post("/game-server/ready/:roomId", (req, res) => {
            const roomId = req.params.roomId;
            if (!lobbyRoomList.has(roomId)) {
                res.status(404).send();
                return;
            }
            const room = lobbyRoomList.get(roomId);
            room.onGameServerReady(req.body);
        })

        // TODO: Implement game-server health ping

        /**
         * Bind @colyseus/monitor
         * It is recommended to protect this route with a password.
         * Read more: https://docs.colyseus.io/tools/monitor/
         */
        app.use("/colyseus", monitor());
    },


    beforeListen: () => {
        /**
         * Before before gameServer.listen() is called.
         */
    }
});