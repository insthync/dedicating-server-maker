import { LobbyRoom } from "./LobbyRoom";

const rooms: { [key: string]: LobbyRoom } = {};

export function add(room: LobbyRoom): void {
    rooms[room.roomId] = room;
}

export function remove(room: LobbyRoom): void {
    delete rooms[room.roomId];
}

export function count(): number {
    return Object.keys(rooms).length;
}

export function has(roomId: string): boolean {
    return (roomId in rooms) ? true : false;
}

export function get(roomId: string): LobbyRoom {
    return rooms[roomId];
}