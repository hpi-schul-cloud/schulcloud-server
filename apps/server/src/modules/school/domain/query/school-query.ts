import { EntityId } from '@shared/domain/types/entity-id';
import { SchoolPurpose } from '../type';

export interface SchoolQuery {
	federalStateId?: EntityId;
	externalId?: string;
	systemId?: EntityId;
	purpose?: SchoolPurpose;
}
