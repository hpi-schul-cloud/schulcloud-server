import { Injectable, NotFoundException } from '@nestjs/common';
import { Card, EntityId, TextElement } from '@shared/domain';
import { LegacyLogger } from '@src/core/logger';
import { BoardDoService, ColumnBoardService, ContentElementService } from '../service';
import { CardService } from '../service/card.service';

@Injectable()
export class CardUc {
	constructor(
		private readonly cardService: CardService,
		private readonly columnBoardService: ColumnBoardService,
		private readonly boardDoService: BoardDoService,
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

	async createCard(userId: EntityId, boardId: EntityId, columnId: EntityId): Promise<Card> {
		this.logger.debug({ action: 'createCard', userId, boardId, columnId });

		// TODO: check Permissions
		const card = await this.columnBoardService.createCard(boardId, columnId);

		return card;
	}

	async deleteCard(userId: EntityId, cardId: EntityId): Promise<void> {
		this.logger.debug({ action: 'deleteCard', userId, cardId });

		const parent = await this.boardDoService.findParentOfId(cardId);
		if (parent === undefined) {
			throw new NotFoundException('card has no parent');
		}
		// TODO check permissions

		await this.boardDoService.deleteChild(parent, cardId);
	}

	async createElement(userId: EntityId, cardId: EntityId): Promise<TextElement> {
		this.logger.debug({ action: 'createElement', userId, cardId });

		const card = await this.cardService.findById(cardId);

		// TODO check permissions
		const element = await this.elementService.createElement(card.id);

		return element;
	}

	async deleteElement(userId: EntityId, cardId: EntityId, contentElementId: EntityId): Promise<void> {
		this.logger.debug({ action: 'deleteElement', userId, cardId, contentElementId });

		const card = await this.cardService.findById(cardId);

		// TODO check permissions

		await this.boardDoService.deleteChild(card, contentElementId);
	}
}
