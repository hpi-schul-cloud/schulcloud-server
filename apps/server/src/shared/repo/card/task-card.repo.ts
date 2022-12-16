import { Injectable } from '@nestjs/common';
import { EntityId, TaskCard } from '@shared/domain';
import { BaseRepo } from '../base.repo';

/*
export abstract class CardRepo extends BaseRepo<Card> {
	get entityName() {
		return Card;
	}

	private async populateCard(card: Card) {
		//await card.cardElements.init();
	}
}*/

@Injectable()
export class TaskCardRepo extends BaseRepo<TaskCard> {
	get entityName() {
		return TaskCard;
	}

	async createTaskCard(taskCard: TaskCard): Promise<void> {
		//  const cardElements = taskCard.cardElements;
		//taskCard.cardElements = [];
		return this.save(this.create(taskCard));
	}

	async findById(id: EntityId) {
		const card = await this._em.findOneOrFail(this.entityName, { id });
		if (card.task !== null) {
			await this._em.populate(card, ['task']);
		}
		return card;
	}
}
