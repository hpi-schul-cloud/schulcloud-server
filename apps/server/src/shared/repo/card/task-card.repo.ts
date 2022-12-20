import { Injectable } from '@nestjs/common';
import { EntityId, TaskCard } from '@shared/domain';
import { BaseRepo } from '../base.repo';

@Injectable()
export class TaskCardRepo extends BaseRepo<TaskCard> {
	get entityName() {
		return TaskCard;
	}

	async findById(id: EntityId) {
		const card = await this._em.findOneOrFail(this.entityName, { id });
		await card.cardElements.init();
		await this._em.populate(card, true);
		return card;
	}
}
