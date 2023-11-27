import { EntityId } from '@shared/domain';

// TODO: Shall this better be a domain object because it has an id?
export interface County {
	id: EntityId;
	name: string;
	countyId: number;
	antaresKey: string;
}
