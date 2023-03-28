import { Injectable } from '@nestjs/common';
import { EntityId, TextElement } from '@shared/domain';
import { ObjectId } from 'bson';
import { BoardDoRepo } from '../repo';

@Injectable()
export class ContentElementService {
	constructor(private readonly boardDoRepo: BoardDoRepo) {}

	async createElement(cardId: EntityId): Promise<TextElement> {
		const card = await this.boardDoRepo.findById(cardId);

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
}
