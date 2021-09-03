import { Room, Client } from "colyseus";
import { LobbyRoomState } from "./schema/RoomState";

export class LobbyRoom extends Room<LobbyRoomState> {

  onCreate (options: any) {
    this.setState(new LobbyRoomState());

    this.onMessage("type", (client, message) => {
      //
      // handle "type" message
      //
    });

  }

  onJoin (client: Client, options: any) {
    console.log(client.sessionId, "joined!");
  }

  onLeave (client: Client, consented: boolean) {
    console.log(client.sessionId, "left!");
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");
  }

}
