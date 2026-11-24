import { type EntityId } from '@shared/domain/types';

export interface VisibleRoomGroup {
	id: EntityId;
	name: string;
	collapsed: boolean;
	roomIds: EntityId[];
}

export interface VisibleRoomArrangement {
	revision: number;
	ungroupedRoomIds: EntityId[];
	groups: VisibleRoomGroup[];
	confirmGroupDeletion: boolean;
}

export interface VisibleRoomArrangementWithCreatedGroup extends VisibleRoomArrangement {
	createdGroupId: EntityId;
}
