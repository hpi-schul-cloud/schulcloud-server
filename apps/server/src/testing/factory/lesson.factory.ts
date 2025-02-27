// Remove the eslint-disable after fixing the import issue in EPIC-96
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { courseEntityFactory } from '@modules/course/testing';
import { LessonEntity, LessonProperties } from '@shared/domain/entity';
import { BaseFactory } from './base.factory';

class LessonFactory extends BaseFactory<LessonEntity, LessonProperties> {}

export const lessonFactory = LessonFactory.define(LessonEntity, ({ sequence }) => {
	return {
		name: `lesson #${sequence}`,
		course: courseEntityFactory.build(),
		contents: [],
		hidden: false,
		materials: [],
	};
});
