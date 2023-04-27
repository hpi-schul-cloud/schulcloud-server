import { Injectable, NotFoundException } from '@nestjs/common';
import { Card, Column, EntityId } from '@shared/domain';
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
			title: ``,
			height: 150,
			children: [],
		});

		parent.addChild(card);

		await this.boardDoRepo.save(parent.children, parent);

		return card;
	}

	async delete(card: Card): Promise<void> {
		await this.boardDoService.deleteWithDescendants(card);
	}

	async move(card: Card, targetColumn: Column, targetPosition?: number): Promise<void> {
		await this.boardDoService.move(card, targetColumn, targetPosition);
	}

	async updateTitle(card: Card, title: string): Promise<void> {
		const parent = await this.boardDoRepo.findParentOfId(card.id);
		card.title = title;
		await this.boardDoRepo.save(card, parent);
	}
}
