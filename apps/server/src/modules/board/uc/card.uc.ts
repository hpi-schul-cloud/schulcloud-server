import { Injectable } from '@nestjs/common';
import { Card, EntityId } from '@shared/domain';
import { Logger } from '@src/core/logger';
import { CardRepo } from '../repo/card.repo';

@Injectable()
export class CardUc {
	constructor(private readonly cardRepo: CardRepo, private readonly logger: Logger) {
		this.logger.setContext(CardUc.name);
	}

	async findCards(userId: EntityId, cardIds: EntityId[]): Promise<Card[]> {
		this.logger.debug({ action: 'findCards', userId, cardIds });

		// TODO check permissions
		const cards = await this.cardRepo.findByIds(cardIds);
		return cards;
	}
}
