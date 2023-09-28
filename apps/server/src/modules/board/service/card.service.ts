import { Injectable, NotFoundException } from '@nestjs/common';
import { Card, Column, ContentElementType, EntityId, LinkElement } from '@shared/domain';
import { ObjectId } from 'bson';
import { BoardDoRepo } from '../repo';
import { BoardDoService } from './board-do.service';
import { ContentElementService } from './content-element.service';
import { OpenGraphProxyService } from './open-graph-proxy.service';

@Injectable()
export class CardService {
	constructor(
		private readonly boardDoRepo: BoardDoRepo,
		private readonly boardDoService: BoardDoService,
		private readonly contentElementService: ContentElementService,
		private readonly openGraphProxyService: OpenGraphProxyService
	) {}

	async findById(cardId: EntityId): Promise<Card> {
		const card = await this.boardDoRepo.findByClassAndId(Card, cardId);
		const extendedCard = await this.extendLinkElements(card);
		return extendedCard;
	}

	async findByIds(cardIds: EntityId[]): Promise<Card[]> {
		const cards = await this.boardDoRepo.findByIds(cardIds);
		if (cards.some((card) => !(card instanceof Card))) {
			throw new NotFoundException('some ids do not belong to a card');
		}

		const promises: Promise<Card>[] = [];
		for (const card of cards) {
			const extendedCardPromise = this.extendLinkElements(card as Card);
			promises.push(extendedCardPromise);
		}

		const extendedCards = Promise.all(promises);
		return extendedCards;
	}

	private async extendLinkElements(card: Card): Promise<Card> {
		const linkElements: LinkElement[] = card.children.filter((c) => c instanceof LinkElement) as LinkElement[];
		const promises: Promise<unknown>[] = [];
		for (const linkElement of linkElements) {
			promises.push(this.extendLinkElement(linkElement));
		}
		(await Promise.all(promises)) as LinkElement[];

		return card;
	}

	private async extendLinkElement(linkElement: LinkElement): Promise<void> {
		linkElement.openGraphData = await this.openGraphProxyService.fetchOpenGraphData(linkElement.url);
		return Promise.resolve();
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
