import { type EntityId } from '@shared/domain/types';
import { type RoomContentType } from './room-content-type.enum';

export interface RoomContentItem {
	type: RoomContentType;
	id: EntityId;
}

export interface RoomContentProps {
	roomId: EntityId;
	items: RoomContentItem[];
}
