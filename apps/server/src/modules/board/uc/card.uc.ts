import { Injectable } from '@nestjs/common';
import { Card, EntityId, TextElement } from '@shared/domain';
import { Logger } from '@src/core/logger';
import { ColumnService, ContentElementService } from '../service';
import { CardService } from '../service/card.service';

@Injectable()
export class CardUc {
	constructor(
		private readonly columnService: ColumnService,
		private readonly cardService: CardService,
		private readonly elementService: ContentElementService,
		private readonly logger: Logger
	) {
		this.logger.setContext(CardUc.name);
	}

	async findCards(userId: EntityId, cardIds: EntityId[]): Promise<Card[]> {
		this.logger.debug({ action: 'findCards', userId, cardIds });

		// TODO: check permissions
		const cards = await this.cardService.findByIds(cardIds);
		return cards;
	}

	async moveCard(userId: EntityId, cardId: EntityId, targetColumnId: EntityId, targetPosition: number): Promise<void> {
		this.logger.debug({ action: 'moveCard', userId, cardId, targetColumnId, toPosition: targetPosition });

		const card = await this.cardService.findById(cardId);
		const targetColumn = await this.columnService.findById(targetColumnId);

		// TODO check permissions

		await this.cardService.move(card, targetColumn, targetPosition);
	}

	async deleteCard(userId: EntityId, cardId: EntityId): Promise<void> {
		this.logger.debug({ action: 'deleteCard', userId, cardId });

		const card = await this.cardService.findById(cardId);

		// TODO check permissions

		await this.cardService.delete(card);
	}

	// --- elements ---

	async createElement(userId: EntityId, cardId: EntityId): Promise<TextElement> {
		this.logger.debug({ action: 'createElement', userId, cardId });

		const card = await this.cardService.findById(cardId);

		// TODO check permissions
		const element = await this.elementService.create(card);

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
