import { Schema, Context, type } from "@colyseus/schema";

export class LobbyRoomState extends Schema {

  @type("string") mySynchronizedProperty: string = "Hello world";

}
