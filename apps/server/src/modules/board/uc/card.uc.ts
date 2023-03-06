import { Injectable } from '@nestjs/common';
import { Card, EntityId } from '@shared/domain';
import { CardRepo } from '../repo/card.repo';

@Injectable()
export class CardUc {
	constructor(private readonly cardRepo: CardRepo) {}

	async findCards(userId: EntityId, cardIds: EntityId[]): Promise<Card[]> {
		// TODO check permissions
		const cards = await this.cardRepo.findByIds(cardIds);
		return cards;
	}
}
