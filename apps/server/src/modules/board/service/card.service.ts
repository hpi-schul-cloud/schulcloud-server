import { Injectable, NotFoundException } from '@nestjs/common';
import { Card, EntityId } from '@shared/domain';
import { ObjectId } from 'bson';
import { CardRepo, ColumnBoardRepo } from '../repo';

@Injectable()
export class CardService {
	constructor(private readonly cardRepo: CardRepo, private readonly columnBoardRepo: ColumnBoardRepo) {}

	async findById(id: EntityId): Promise<Card> {
		const card = this.cardRepo.findById(id);
		return card;
	}

	async findByIds(cardIds: EntityId[]): Promise<Card[]> {
		const cards = await this.cardRepo.findByIds(cardIds);
		return cards;
	}

	async createCard(boardId: EntityId, columnId: EntityId): Promise<Card> {
		const board = await this.columnBoardRepo.findById(boardId);
		const column = board.columns.find((c) => c.id === columnId);

		if (column == null) {
			throw new NotFoundException(`The requested Column: id='${columnId}' has not been found.`);
		}

		const card = new Card({
			id: new ObjectId().toHexString(),
			title: ``,
			height: 150,
			elements: [],
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		column.addCard(card);

		await this.cardRepo.save(column.cards, column.id);

		return card;
	}
}
