import { Room, Client } from "colyseus";
import { LobbyPlayer } from "./schema/LobbyPlayer";
import { LobbyRoomState } from "./schema/LobbyRoomState";
import { EGameServerState } from "./enums/EGameServerState";
import { ELobbyRoomState } from "./enums/ELobbyRoomState";
import * as lobbyRoomList from "./LobbyRoomList";
import * as child from "child_process";
import * as shell from 'shelljs'

export class LobbyRoom extends Room<LobbyRoomState> {
  maxTeams: number = 1;
  password: string = "";
  annotations: { [key: string]: string } = {};
  currentGameServerState: EGameServerState = EGameServerState.None;
  currentLobbyRoomState: ELobbyRoomState = ELobbyRoomState.Running;
  roomDisposeCountDown: number = 5000;
  playerLoginTokens: { [key: string]: string } = {};
  gameServerProcess: child.ChildProcess = undefined;
  unHealthyCountdown: number = 0;

  onCreate (options: any) {
    const hasPassword: boolean = options.password && options.password.length > 0;
    this.maxClients = options.maxClients;
    this.maxTeams = options.maxTeams;
    this.password = options.password;
    this.annotations = options.annotations;
    // Create and set room state
    this.setState(new LobbyRoomState());
    // Set metadata by options
    this.setMetadata({
      title: options.title,
      annotations: options.annotations,
      hasPassword: hasPassword,
    });
    // Setup game messages
    // TODO: Add room management messages
    this.onMessage("startGame", this.onStartGame);
    lobbyRoomList.add(this);
    console.log("room " + options.title + " created, has password? " + hasPassword);
    this.setSimulationInterval((deltaTime) => this.update(deltaTime));
  }

  onJoin (client: Client, options: any) {
    // TODO: Login validation
    this.onPlayerValidated(client, options);
  }

  onLeave (client: Client, consented: boolean) {
    this.state.players.delete(client.sessionId);
    this.broadcast("playerLeave", client.sessionId);
    // Change room manager Id
    if (this.clients.length > 0) {
      this.state.managerSessionId = this.clients[0].sessionId;
    } else {
      this.state.managerSessionId = "";
    }
    console.log(client.sessionId + " left!");
  }

  onDispose() {
    console.log("room " + this.roomId + " disposing...");
    lobbyRoomList.remove(this);
  }

  onPlayerValidated(client: Client, options: any) {
    // Store player login token, it may being used for web-service validation
    this.playerLoginTokens[client.sessionId] = options.loginToken;
    // Create new player and set to room state
    const newPlayer = new LobbyPlayer().assign({
      sessionId: client.sessionId,
      id: options.id,
      name: options.name,
    });
    this.state.players.set(client.sessionId, newPlayer);
    // Set manager session Id
    if (!this.hasManager()) {
      this.state.managerSessionId = client.sessionId;
    }
    console.log(client.sessionId + " joined!");
  }

  onStartGame(client: Client, message: any) {
    const player: LobbyPlayer = this.state.players.get(client.sessionId);
    // Reject non-manager player
    if (!player || !this.playerIsManager(player)) {
      // TODO: May send error message to the client
      return;
    }
    const filePath = String(process.env.EXE_PATH);
    let cmd = "nohup ";
    cmd += `${filePath} `;
    // Room ID
    cmd += `${process.env.EXE_LAUNCH_ARG_ROOM_ID} `;
    cmd += `${this.roomId} `;
    // Address
    cmd += `${process.env.EXE_LAUNCH_ARG_ADDRESS} `;
    cmd += `${process.env.EXE_LAUNCH_ADDRESS} `;
    // Port
    cmd += `${process.env.EXE_LAUNCH_ARG_PORT} `;
    cmd += `${lobbyRoomList.getPort()} `;
    // Other arguments
    const args: Array<string> = JSON.parse(process.env.EXE_LAUNCH_ARGS);
    cmd += args.join(' ');
    // launch a game-server
    this.gameServerProcess = shell.exec(cmd, {silent: true, async: true})
    this.gameServerProcess.on("close", (code, signal) => {
      this.currentGameServerState = EGameServerState.None;
      console.log(`${this.roomId} game-server closing, code: ${code}  signal: ${signal}`)
    })
    console.log(`${this.roomId} game-server launched.`);
    this.currentGameServerState = EGameServerState.Starting;
  }

  onGameServerReady(options: any) {
    this.broadcast("gameServerReady", options);
    this.currentGameServerState = EGameServerState.Running;
  }

  onGameServerPing() {
    this.unHealthyCountdown = 10000;
  }

  update(deltaTime: number) {
    switch (this.currentLobbyRoomState) {
      case ELobbyRoomState.Running:
        // No manager, disposing the room within `NO_MANAGER_DISPOSE_DELAY` milliseconds
        if (!this.hasManager() || !this.state.players.has(this.state.managerSessionId)) {
          this.currentLobbyRoomState = ELobbyRoomState.Stopping;
          this.roomDisposeCountDown = parseInt(process.env.NO_MANAGER_DISPOSE_DELAY);
          return;
        }
        break;
      case ELobbyRoomState.Stopping:
        // It will dispose this room when it still has no manager and dispose count down reached `0`
        if (this.hasManager() && this.state.players.has(this.state.managerSessionId)) {
          this.currentLobbyRoomState = ELobbyRoomState.Running;
        } else {
          this.roomDisposeCountDown -= deltaTime;
          if (this.roomDisposeCountDown <= 0) {
            this.currentLobbyRoomState = ELobbyRoomState.Stopped;
            this.disconnect();
          }
        }
        break;
      case ELobbyRoomState.Stopped:
        break;
    }
    switch (this.currentGameServerState) {
      case EGameServerState.Running:
        this.unHealthyCountdown -= deltaTime;
        if (this.unHealthyCountdown <= 0) {
          // TODO: Implement unhealthy game-server state
        }
        break;
    }
  }

  getInfo() {
    return {
      roomId: this.roomId,
      roomName: this.roomName,
      maxClients: this.maxClients,
      maxTeams: this.maxTeams,
      annotations: this.annotations,
    };
  }

  playerIsManager(player: LobbyPlayer) {
    return this.hasManager() && this.state.managerSessionId === player.sessionId;
  }

  hasManager() {
    return this.state.managerSessionId && this.state.managerSessionId.length > 0;
  }
}
