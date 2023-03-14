import { Injectable } from '@nestjs/common';
import { Card, EntityId } from '@shared/domain';
import { CardRepo } from '../repo/card.repo';

@Injectable()
export class CardService {
	constructor(private readonly cardRepo: CardRepo) {}

	async findByIds(cardIds: EntityId[]): Promise<Card[]> {
		const cards = await this.cardRepo.findByIds(cardIds);
		return cards;
	}
}
