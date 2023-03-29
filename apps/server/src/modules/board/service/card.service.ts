import { Injectable, NotFoundException } from '@nestjs/common';
import { Card, Column, EntityId } from '@shared/domain';
import { ObjectId } from 'bson';
import { BoardDoRepo } from '../repo';

@Injectable()
export class CardService {
	constructor(private readonly boardDoRepo: BoardDoRepo) {}

	async findById(cardId: EntityId): Promise<Card> {
		const card = await this.boardDoRepo.findByClassAndId(Card, cardId);
		return card;
	}

	async findByIds(cardIds: EntityId[]): Promise<Card[]> {
		const cards = await this.boardDoRepo.findByIds(cardIds);
		if (cards.every((card) => card instanceof Card)) {
			return cards as Card[];
		}
		throw new NotFoundException('some ids do not belong to a card');
	}

	async create(columnId: EntityId): Promise<Card> {
		const column = await this.boardDoRepo.findByClassAndId(Column, columnId);

		const card = new Card({
			id: new ObjectId().toHexString(),
			title: ``,
			height: 150,
			children: [],
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		column.addChild(card);

		await this.boardDoRepo.save(column.children, column.id);

		return card;
	}

	async deleteById(cardId: EntityId): Promise<void> {
		await this.boardDoRepo.deleteByClassAndId(Card, cardId);
	}
}
