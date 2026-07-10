import { type EntityId } from '@shared/domain/types/entity-id';
import { type SchoolPurpose } from '../type';

export interface SchoolQuery {
	federalStateId?: EntityId;
	externalId?: string;
	systemId?: EntityId;
	purpose?: SchoolPurpose;
}
