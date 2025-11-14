import type { Room } from '@modules/room';

export type RoomWithLockedStatus = { room: Room; isLocked: boolean };
