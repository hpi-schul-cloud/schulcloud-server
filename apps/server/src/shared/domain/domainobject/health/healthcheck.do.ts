import { EntityId } from '@shared/domain/types';

export class HealthcheckDO {
	id: EntityId;

	updatedAt: Date;

	constructor(id: EntityId, updatedAt: Date) {
		this.id = id;
		this.updatedAt = updatedAt;
	}
}
