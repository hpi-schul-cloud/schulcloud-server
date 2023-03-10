import { Injectable } from '@nestjs/common';
import { Card, EntityId } from '@shared/domain';
// import { BoardRepo } from '@shared/repo';
import { Logger } from '@src/core/logger';
import { CardRepo } from '../repo/card.repo';

@Injectable()
export class CardUc {
	constructor(
		private readonly cardRepo: CardRepo,
		// private readonly boardRepo: BoardRepo,
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

	// async createCard(userId: EntityId, boardId: EntityId, columnId: EntityId, position = 0): Promise<ColumnBoard> {
	// 	this.logger.debug({ action: 'createBoard', userId });

	// 	const card = new Card({});
	// 	const board = this.boardRepo.findById(boardId);
	// 	const column = board.columns.find((c) => c.id === columnId);
	// 	column.cards.splice(position, 0, card);

	// 	const ancestors = [board, column];

	// 	BoardRepo.saveCards(column.cards, ancestors);
	// }
}
