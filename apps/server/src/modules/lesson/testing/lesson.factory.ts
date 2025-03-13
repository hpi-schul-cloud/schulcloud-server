import { courseEntityFactory } from '@modules/course/testing';
import { BaseFactory } from '@testing/factory/base.factory';
import { LessonEntity, LessonProperties } from '../repo';

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
