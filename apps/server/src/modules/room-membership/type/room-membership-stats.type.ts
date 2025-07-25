import { EntityId } from '@shared/domain/types';

export type MemberStats = {
	totalMembers: number;
	internalMembers: number;
	externalMembers: number;
};

export type RoomMembershipStats = MemberStats & {
	roomId: EntityId;
	owner: string | undefined;
};
