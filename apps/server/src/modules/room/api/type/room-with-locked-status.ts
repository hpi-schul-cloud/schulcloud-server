import type { Room } from '@modules/room';
import { RoomOperation } from '@modules/room-membership/authorization/room.rule';

export type RoomWithAllowedOperationsAndLockedStatus = {
	room: Room;
	allowedOperations: Record<RoomOperation, boolean>;
	isLocked: boolean;
};
