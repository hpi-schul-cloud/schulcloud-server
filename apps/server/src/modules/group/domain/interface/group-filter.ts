import { type GroupTypes } from '@modules/group';
import { type EntityId } from '@shared/domain/types';

export interface GroupFilter {
	userId?: EntityId;
	userIds?: EntityId[];
	schoolId?: EntityId;
	systemId?: EntityId;
	groupTypes?: GroupTypes[];
	nameQuery?: string;
}
