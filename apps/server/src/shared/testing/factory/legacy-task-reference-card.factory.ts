import { ICardCProps } from '@shared/domain';
import { LegacyTaskReferenceCard } from '@shared/domain/entity/card.entity';
import { BaseFactory } from './base.factory';
import { userFactory } from './user.factory';

export const legacyTaskReferenceCardFactory = BaseFactory.define<LegacyTaskReferenceCard, ICardCProps>(
	LegacyTaskReferenceCard,
	() => {
		return {
			cardElements: [],
			creator: userFactory.build(),
			draggable: false,
			visibleAtDate: undefined,
		};
	}
);
