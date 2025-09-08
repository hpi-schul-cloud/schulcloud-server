import { GroupTypes } from '@modules/group';
import { EntityId } from '@shared/domain/types';

export interface GroupFilter {
	userId?: EntityId;
	userIds?: EntityId[];
	schoolId?: EntityId;
	systemId?: EntityId;
	groupTypes?: GroupTypes[];
	nameQuery?: string;
}
