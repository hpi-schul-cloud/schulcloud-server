import { EntityId } from '@shared/domain/types';

export type RoomStats = {
	name: string;
	roomId: EntityId;
	owner: string | undefined;
	totalMembers: number;
	internalMembers: number;
	externalMembers: number;
	schoolName: string;
	createdAt: Date;
	updatedAt: Date;
};
