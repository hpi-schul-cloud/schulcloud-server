import { Injectable } from '@nestjs/common';
import { EntityId, MetaCard } from '@shared/domain';
import { CardRepo } from '@shared/repo/board/card-repo';

@Injectable()
export class CardUc {
	constructor(private readonly cardRepo: CardRepo) {}

	async findCards(userId: EntityId, cardIds: EntityId[]): Promise<MetaCard[]> {
		const cards = await this.cardRepo.findManyByIds(cardIds);
		return cards;
	}
}
