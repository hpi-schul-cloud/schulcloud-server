import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain';
import { MetaCard } from '@shared/domain/entity/card.entity';
import { BaseRepo } from '../base.repo';

@Injectable()
export class CardRepo extends BaseRepo<MetaCard> {
	get entityName() {
		return MetaCard;
	}

	async findById(id: EntityId): Promise<MetaCard> {
		const card = await this._em.findOneOrFail(MetaCard, { id });
		return card;
	}
}
