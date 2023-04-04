import { Injectable, NotFoundException } from '@nestjs/common';
import { Card, Column, EntityId } from '@shared/domain';
import { ObjectId } from 'bson';
import { BoardDoRepo } from '../repo';
import { BoardDoService } from './board-do.service';

@Injectable()
export class CardService {
	constructor(private readonly boardDoRepo: BoardDoRepo, private readonly boardDoService: BoardDoService) {}

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

	async create(parent: Column): Promise<Card> {
		const card = new Card({
			id: new ObjectId().toHexString(),
			title: ``,
			height: 150,
			children: [],
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		parent.addChild(card);

		await this.boardDoRepo.save(parent.children, parent.id);

		return card;
	}

	async delete(parent: Column, cardId: EntityId): Promise<void> {
		await this.boardDoService.deleteChildWithDescendants(parent, cardId);
	}

	async move(cardId: EntityId, targetColumnId: EntityId, toIndex: number): Promise<void> {
		await this.boardDoService.moveBoardDo(cardId, targetColumnId, toIndex);
	}
}
