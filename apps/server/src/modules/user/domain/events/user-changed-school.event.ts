import { EntityId } from '@shared/domain/types';

export class UserChangedSchoolEvent {
	constructor(public readonly userId: EntityId, public readonly oldSchoolId: EntityId) {}
}
