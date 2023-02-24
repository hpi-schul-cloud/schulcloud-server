import { LegacyLessonReferenceCard, MetaCardProps } from '@shared/domain/entity/card.entity';
import { BaseFactory } from './base.factory';
import { legacyLessonContentElementFactory } from './legacy-lesson-content-element.factory';
import { userFactory } from './user.factory';

export const legacyLessonReferenceCardFactory = BaseFactory.define<LegacyLessonReferenceCard, MetaCardProps>(
	LegacyLessonReferenceCard,
	() => {
		return {
			elements: [legacyLessonContentElementFactory.build()],
			publishedAt: new Date(),
			creator: userFactory.build(),
		};
	}
);
