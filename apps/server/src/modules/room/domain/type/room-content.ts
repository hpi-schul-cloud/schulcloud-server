import { EntityId } from '@shared/domain/types';
import { RoomContentType } from './room-content-type.enum';

export type RoomContentItem = {
	type: RoomContentType;
	id: EntityId;
};
