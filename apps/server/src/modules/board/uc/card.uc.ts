import { Injectable } from '@nestjs/common';
import { Card, EntityId, TextElement } from '@shared/domain';
import { Logger } from '@src/core/logger';
import { BoardDoService, ColumnBoardService, ContentElementService } from '../service';
import { CardService } from '../service/card.service';

@Injectable()
export class CardUc {
	constructor(
		private readonly cardService: CardService,
		private readonly columnBoardService: ColumnBoardService,
		private readonly boardDoService: BoardDoService,
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

	async createElement(userId: EntityId, cardId: EntityId): Promise<TextElement> {
		this.logger.debug({ action: 'createElement', userId, cardId });

		const card = await this.cardService.findById(cardId);

		// TODO check permissions
		const element = await this.elementService.create(card.id);

		return element;
	}

	async deleteElement(userId: EntityId, cardId: EntityId, elementId: EntityId): Promise<void> {
		this.logger.debug({ action: 'deleteElement', userId, cardId, elementId });

		// const card = await this.cardService.findById(cardId);

		// TODO check permissions

		await this.elementService.deleteById(elementId);
	}
}
