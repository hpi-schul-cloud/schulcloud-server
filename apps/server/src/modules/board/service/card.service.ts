import { Injectable, NotFoundException } from '@nestjs/common';
import { Card, EntityId } from '@shared/domain';
import { ObjectId } from 'bson';
import { CardRepo } from '../repo/card.repo';
import { ColumnBoardService } from './board.service';

@Injectable()
export class CardService {
	constructor(private readonly cardRepo: CardRepo, private readonly columnBoardService: ColumnBoardService) {}

	async findByIds(cardIds: EntityId[]): Promise<Card[]> {
		const cards = await this.cardRepo.findByIds(cardIds);
		return cards;
	}

	async createCard(boardId: EntityId, columnId: EntityId): Promise<Card> {
		const board = await this.columnBoardService.findById(boardId);
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
