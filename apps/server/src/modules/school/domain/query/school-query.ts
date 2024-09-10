import { EntityId } from '@shared/domain/types/entity-id';

export interface SchoolQuery {
	federalStateId?: EntityId;
	externalId?: string;
	systemId?: EntityId;
}
