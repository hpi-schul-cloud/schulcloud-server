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

	async findById(id: EntityId) {
		const card = await this._em.findOneOrFail(this.entityName, { id });
		await card.cardElements.init();
		await card.cardElements.loadItems();
		//const elements = card.cardElements.getItems();
		//card.cardElements = elements;
		await this._em.populate(card, ['cardElements']);
		return card;
	}
}
