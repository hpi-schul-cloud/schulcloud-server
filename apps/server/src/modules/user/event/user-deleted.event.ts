import { EntityId } from '@shared/domain/types';

export class UserDeletedEvent {
	constructor(public readonly userId: EntityId) {}
}
