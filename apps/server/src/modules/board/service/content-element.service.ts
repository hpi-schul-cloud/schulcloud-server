import { Injectable } from '@nestjs/common';
import { EntityId, TextElement } from '@shared/domain';
import { ObjectId } from 'bson';
import { CardRepo, ContentElementRepo } from '../repo';

@Injectable()
export class ContentElementService {
	constructor(private readonly elementRepo: ContentElementRepo, private readonly cardRepo: CardRepo) {}

	async createElement(cardId: EntityId): Promise<TextElement> {
		const card = await this.cardRepo.findById(cardId);

		const element = new TextElement({
			id: new ObjectId().toHexString(),
			text: ``,
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		card.addElement(element);

		await this.elementRepo.save(card.elements, card.id);

		return element;
	}
}
