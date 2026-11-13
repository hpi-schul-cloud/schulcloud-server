import { type RoomOperation } from '@modules/room-membership/authorization/room.rule';
import { type Room } from '../../domain';

export type RoomArchived = {
	room: Room;
	allowedOperations: Record<RoomOperation, boolean>;
	totalMembers: number;
	ownerName?: string;
	schoolName: string;
};
