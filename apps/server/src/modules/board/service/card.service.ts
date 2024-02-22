import { Injectable, NotFoundException } from '@nestjs/common';
import { Card, Column, ContentElementType } from '@shared/domain/domainobject';
import { EntityId } from '@shared/domain/types';
import { ObjectId } from '@mikro-orm/mongodb';
import { BoardDoRepo } from '../repo';
import { BoardDoService } from './board-do.service';
import { ContentElementService } from './content-element.service';

@Injectable()
export class CardService {
	constructor(
		private readonly boardDoRepo: BoardDoRepo,
		private readonly boardDoService: BoardDoService,
		private readonly contentElementService: ContentElementService
	) {}

	async findById(cardId: EntityId): Promise<Card> {
		return this.boardDoRepo.findByClassAndId(Card, cardId);
	}

	async findByIds(cardIds: EntityId[]): Promise<Card[]> {
		const cards = await this.boardDoRepo.findByIds(cardIds);
		if (cards.some((card) => !(card instanceof Card))) {
			throw new NotFoundException('some ids do not belong to a card');
		}

		return cards as Card[];
	}

	async create(parent: Column, requiredEmptyElements?: ContentElementType[]): Promise<Card> {
		const card = new Card({
			id: new ObjectId().toHexString(),
			title: '',
			height: 150,
			children: [],
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		parent.addChild(card);

		await this.boardDoRepo.save(parent.children, parent);

		if (requiredEmptyElements) {
			await this.createEmptyElements(card, requiredEmptyElements);
		}

		return card;
	}

	async delete(card: Card): Promise<void> {
		await this.boardDoService.deleteWithDescendants(card);
	}

	async move(card: Card, targetColumn: Column, targetPosition?: number): Promise<void> {
		await this.boardDoService.move(card, targetColumn, targetPosition);
	}

	async updateHeight(card: Card, height: number): Promise<void> {
		const parent = await this.boardDoRepo.findParentOfId(card.id);
		card.height = height;
		await this.boardDoRepo.save(card, parent);
	}

	async updateTitle(card: Card, title: string): Promise<void> {
		const parent = await this.boardDoRepo.findParentOfId(card.id);
		card.title = title;
		await this.boardDoRepo.save(card, parent);
	}

	private async createEmptyElements(card: Card, requiredEmptyElements: ContentElementType[]): Promise<void> {
		for await (const requiredEmptyElement of requiredEmptyElements) {
			await this.contentElementService.create(card, requiredEmptyElement);
		}
	}
}
