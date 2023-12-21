import { EntityId } from '@shared/domain/types';

export class TeamDeletedEvent {
	constructor(public readonly teamId: EntityId) {}
}
