import { Lesson } from '@shared/domain';
import { LegacyLessonContentElement } from '@shared/domain/entity/card.entity';
import { BaseFactory } from './base.factory';
import { lessonFactory } from './lesson.factory';

export const legacyLessonContentElementFactory = BaseFactory.define<LegacyLessonContentElement, { lesson: Lesson }>(
	LegacyLessonContentElement,
	() => {
		return {
			lesson: lessonFactory.build(),
		};
	}
);
