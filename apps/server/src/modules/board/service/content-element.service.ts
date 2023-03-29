import { Injectable } from '@nestjs/common';
import { Card, EntityId, TextElement } from '@shared/domain';
import { ObjectId } from 'bson';
import { BoardDoRepo } from '../repo';

@Injectable()
export class ContentElementService {
	constructor(private readonly boardDoRepo: BoardDoRepo) {}

	async create(cardId: EntityId): Promise<TextElement> {
		const card = await this.boardDoRepo.findByClassAndId(Card, cardId);

		const element = new TextElement({
			id: new ObjectId().toHexString(),
			text: ``,
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		card.addChild(element);

		await this.boardDoRepo.save(card.children, card.id);

		return element;
	}

	async deleteById(elementId: EntityId): Promise<void> {
		await this.boardDoRepo.deleteByClassAndId(TextElement, elementId);
	}
}
