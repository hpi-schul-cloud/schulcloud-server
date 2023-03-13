import { Injectable } from '@nestjs/common';
import { Card, EntityId } from '@shared/domain';
import { LegacyLogger } from '@src/core/logger';
import { CardService } from '../service/card.service';

@Injectable()
export class CardUc {
	constructor(private readonly cardService: CardService, private readonly logger: LegacyLogger) {
		this.logger.setContext(CardUc.name);
	}

	async findCards(userId: EntityId, cardIds: EntityId[]): Promise<Card[]> {
		this.logger.debug({ action: 'findCards', userId, cardIds });

		// TODO check permissions
		const cards = await this.cardService.findByIds(cardIds);
		return cards;
	}
}
