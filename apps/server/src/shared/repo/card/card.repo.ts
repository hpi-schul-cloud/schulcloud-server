import { Injectable } from '@nestjs/common';
import { Card, EntityId, TaskCard } from '@shared/domain';
import { BaseRepo } from '../base.repo';

@Injectable()
export abstract class CardRepo extends BaseRepo<Card> {
	get entityName() {
		return Card;
	}

	private async populateCard(card: Card) {
		await card.cardElements.init();
	}
}

export class TaskCardRepo extends CardRepo {
	async findById(id: EntityId) {
		const card = await this._em.findOneOrFail(TaskCard, { id });
		if (card.task != null) {
			await this._em.populate(card, ['task']);
		}
		return card;
	}
}
