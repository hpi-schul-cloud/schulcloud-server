import { Injectable, NotFoundException } from '@nestjs/common';
import { Card, EntityId } from '@shared/domain';
import { BoardDoRepo } from '../repo';

@Injectable()
export class CardService {
	constructor(private readonly boardDoRepo: BoardDoRepo) {}

	async findById(id: EntityId): Promise<Card> {
		const card = await this.boardDoRepo.findById(id);
		if (card instanceof Card) {
			return card;
		}
		throw new NotFoundException('there is no card with this id');
	}

	async findByIds(cardIds: EntityId[]): Promise<Card[]> {
		const cards = await this.boardDoRepo.findByIds(cardIds);
		if (cards.every((card) => card instanceof Card)) {
			return cards as Card[];
		}
		throw new NotFoundException('some ids do not belong to a card');
	}
}
