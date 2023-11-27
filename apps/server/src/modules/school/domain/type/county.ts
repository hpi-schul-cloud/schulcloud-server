import { EntityId } from '@shared/domain';

export interface County {
	id: EntityId;
	name: string;
	countyId: number;
	antaresKey: string;
}
