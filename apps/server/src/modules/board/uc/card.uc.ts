import { Injectable } from '@nestjs/common';
import { Card, ContentElementType, EntityId, FileElement, RichTextElement } from '@shared/domain';
import { LegacyLogger } from '@src/core/logger';
import { CardService, ContentElementService } from '../service';

@Injectable()
export class CardUc {
	constructor(
		private readonly cardService: CardService,
		private readonly elementService: ContentElementService,
		private readonly logger: LegacyLogger
	) {
		this.logger.setContext(CardUc.name);
	}

	async findCards(userId: EntityId, cardIds: EntityId[]): Promise<Card[]> {
		this.logger.debug({ action: 'findCards', userId, cardIds });

		// TODO: check permissions
		const cards = await this.cardService.findByIds(cardIds);
		return cards;
	}

	// --- elements ---

	async createElement(
		userId: EntityId,
		cardId: EntityId,
		type: ContentElementType
	): Promise<RichTextElement | FileElement> {
		this.logger.debug({ action: 'createElement', userId, cardId, type });

		const card = await this.cardService.findById(cardId);

		// TODO check permissions
		const element = await this.elementService.create(card, type);

		return element;
	}

	async deleteElement(userId: EntityId, elementId: EntityId): Promise<void> {
		this.logger.debug({ action: 'deleteElement', userId, elementId });

		const element = await this.elementService.findById(elementId);

		// TODO check permissions

		await this.elementService.delete(element);
	}

	async moveElement(
		userId: EntityId,
		elementId: EntityId,
		targetCardId: EntityId,
		targetPosition: number
	): Promise<void> {
		this.logger.debug({ action: 'moveCard', userId, elementId, targetCardId, targetPosition });

		const element = await this.elementService.findById(elementId);
		const targetCard = await this.cardService.findById(targetCardId);

		// TODO check permissions

		await this.elementService.move(element, targetCard, targetPosition);
	}
}
