import { LegacyTaskReferenceCard, MetaCardProps } from '@shared/domain/entity/card.entity';
import { BaseFactory } from './base.factory';
import { legacyTaskContentElementFactory } from './legacy-task-content-element.factory';
import { userFactory } from './user.factory';

export const legacyTaskReferenceCardFactory = BaseFactory.define<LegacyTaskReferenceCard, MetaCardProps>(
	LegacyTaskReferenceCard,
	() => {
		return {
			elements: [legacyTaskContentElementFactory.build()],
			publishedAt: new Date(),
			creator: userFactory.build(),
		};
	}
);
