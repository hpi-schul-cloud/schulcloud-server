import { Injectable, NotFoundException } from '@nestjs/common';
import { Card, CardNode, ColumnBoard, ColumnBoardNode, EntityId } from '@shared/domain';
import { ObjectId } from 'bson';
import { BoardDoRepo } from '../repo';

@Injectable()
export class CardService {
	constructor(private readonly boardDoRepo: BoardDoRepo) {}

	async findById(id: EntityId): Promise<Card> {
		const card = await this.boardDoRepo.findById(CardNode, id);
		return card as Card;
	}

	async findByIds(cardIds: EntityId[]): Promise<Card[]> {
		const cards = await this.boardDoRepo.findByIds(CardNode, cardIds);
		return cards as Card[];
	}

	async createCard(boardId: EntityId, columnId: EntityId): Promise<Card> {
		const board = (await this.boardDoRepo.findById(ColumnBoardNode, boardId)) as ColumnBoard;
		const column = board.children.find((c) => c.id === columnId);

		if (column === undefined) {
			throw new NotFoundException(`The requested Column: id='${columnId}' has not been found.`);
		}

		const card = new Card({
			id: new ObjectId().toHexString(),
			title: ``,
			height: 150,
			children: [],
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		column.addCard(card);

		await this.boardDoRepo.save(column.children, column.id);

		return card;
	}

	async updateCard(card: Card): Promise<void> {
		await this.boardDoRepo.save(card);
	}
}
