import { type EntityId } from '@shared/domain/types';
import { type GroupTypes } from '../group-types';

export interface GroupFilter {
	userId?: EntityId;
	userIds?: EntityId[];
	schoolId?: EntityId;
	systemId?: EntityId;
	groupTypes?: GroupTypes[];
	nameQuery?: string;
}
