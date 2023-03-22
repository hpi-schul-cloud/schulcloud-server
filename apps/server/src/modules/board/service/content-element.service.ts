import { Injectable, NotFoundException } from '@nestjs/common';
import { Card, EntityId, TextElement } from '@shared/domain';
import { ObjectId } from 'bson';
import { BoardDoRepo } from '../repo';

@Injectable()
export class ContentElementService {
	constructor(private readonly boardDoRepo: BoardDoRepo) {}

	async createElement(cardId: EntityId): Promise<TextElement> {
		const card = (await this.boardDoRepo.findById(cardId)) as Card;

		const element = new TextElement({
			id: new ObjectId().toHexString(),
			text: ``,
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		card.addElement(element);

		await this.boardDoRepo.save(card.children, card.id);

		return element;
	}

	async deleteElement(cardId: EntityId, contentElementId: EntityId) {
		const card = (await this.boardDoRepo.findById(cardId)) as Card;

		const child = card.children.find((el) => el.id === contentElementId);
		if (child === undefined) {
			throw new NotFoundException('element does not exist');
		}

		await this.boardDoRepo.deleteChild(card, child.id);

		const children = card.children.filter((el) => el.id !== contentElementId);

		await this.boardDoRepo.save(children, cardId);
	}
}
