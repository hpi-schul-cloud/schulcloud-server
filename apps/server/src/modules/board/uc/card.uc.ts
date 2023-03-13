import { Injectable, NotFoundException } from '@nestjs/common';
import { Card, EntityId, TextElement } from '@shared/domain';
import { Logger } from '@src/core/logger';
import { ObjectId } from 'bson';
import { ColumnBoardRepo, ContentElementRepo } from '../repo';
import { CardRepo } from '../repo/card.repo';

@Injectable()
export class CardUc {
	constructor(
		private readonly cardRepo: CardRepo,
		private readonly elementRepo: ContentElementRepo,
		private readonly columnBoardRepo: ColumnBoardRepo,
		private readonly logger: Logger
	) {
		this.logger.setContext(CardUc.name);
	}

	async findCards(userId: EntityId, cardIds: EntityId[]): Promise<Card[]> {
		this.logger.debug({ action: 'findCards', userId, cardIds });

		// TODO check permissions
		const cards = await this.cardRepo.findByIds(cardIds);
		return cards;
	}

	async createCard(userId: EntityId, boardId: EntityId, columnId: EntityId): Promise<Card> {
		this.logger.debug({ action: 'createCard', userId, boardId, columnId });

		const board = await this.columnBoardRepo.findById(boardId);
		const column = board.columns.find((c) => c.id === columnId);

		if (column == null) {
			throw new NotFoundException(`The requested Column: id='${columnId}' has not been found.`);
		}

		// TODO check permissions

		const card = new Card({
			id: new ObjectId().toHexString(),
			title: ``,
			height: 150,
			elements: [],
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		column.addCard(card);

		await this.cardRepo.save(column.cards, column.id);

		return card;
	}

	async createElement(userId: EntityId, cardId: EntityId): Promise<TextElement> {
		this.logger.debug({ action: 'createElement', userId, cardId });

		const card = await this.cardRepo.findById(cardId);

		// TODO check permissions

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
