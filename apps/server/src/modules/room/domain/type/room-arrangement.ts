import { EntityId } from '@shared/domain/types';

export interface RoomArrangementItem {
	id: EntityId;
}

export interface RoomArrangementProps {
	userId: EntityId;
	items: RoomArrangementItem[];
}
