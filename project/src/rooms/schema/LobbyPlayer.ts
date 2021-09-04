import { Schema, type } from "@colyseus/schema";
import { EPlayerState } from "../enums/EPlayerState";

export class LobbyPlayer extends Schema {
  @type("string")
  sessionId: string = "";

  @type("string")
  id: string = "";

  @type("string")
  name: string = "Player Name";

  @type("uint8")
  team: number = 0;

  @type("uint8")
  state: number = EPlayerState.None;
}
