import { Injectable } from '@nestjs/common';
import { Card, EntityId, TaskCard } from '@shared/domain';
import { BaseRepo } from '../base.repo';

@Injectable()
export abstract class CardRepo extends BaseRepo<Card> {
	get entityName() {
		return Card;
	}

	private async populateCard(card: Card) {
		//await card.cardElements.init();
	}
}

export class TaskCardRepo extends BaseRepo<TaskCard> {
	get entityName() {
		return TaskCard;
	}

	async createTaskCard(taskCard: TaskCard): Promise<void> {
		return this.save(this.create(taskCard));
	}

	async findById(id: EntityId) {
		const card = await this._em.findOneOrFail(this.entityName, { id });
		if (card.task != null) {
			//await this._em.populate(card, ['task']);
		}
		return card;
	}
}
