import { Injectable } from '@nestjs/common';
import { Card, EntityId, TextElement } from '@shared/domain';
import { Logger } from '@src/core/logger';
import { ContentElementService } from '../service';
import { CardService } from '../service/card.service';

@Injectable()
export class CardUc {
	constructor(
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

	async createCard(userId: EntityId, boardId: EntityId, columnId: EntityId): Promise<Card> {
		this.logger.debug({ action: 'createCard', userId, boardId, columnId });

		// TODO: check Permissions
		const card = this.cardService.createCard(boardId, columnId);

		return card;
	}

	async createElement(userId: EntityId, cardId: EntityId): Promise<TextElement> {
		this.logger.debug({ action: 'createElement', userId, cardId });

		const card = await this.cardService.findById(cardId);

		// TODO check permissions
		const element = await this.elementService.createElement(card.id);

		return element;
	}
}
