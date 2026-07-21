import { type EntityId } from '@shared/domain/types';

export type RoomStatsAggregated = {
	roomId: EntityId;
	roomName: string;
	roomSchoolId: EntityId;
	schoolName: string;
	owner: string | undefined;
	totalMembers: number;
	internalMembers: number;
	externalMembers: number;
	createdAt: Date;
	updatedAt: Date;
};

export type RoomStatsAggregatedResult = {
	roomId: string;
	roomName: string;
	roomSchoolId: string;
	schoolName: string;
	ownerFirstName: string;
	ownerLastName: string;
	totalMembers: number;
	internalMembers: number;
	externalMembers: number;
	createdAt: Date;
	updatedAt: Date;
};

