import { EntityId } from '@shared/domain/types';

export interface RoomFilter {
	userId?: EntityId;
	name?: string;
	// TODO filter by date
}
