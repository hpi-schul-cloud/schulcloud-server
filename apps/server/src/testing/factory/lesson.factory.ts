import { ComponentProperties, LessonEntity, LessonProperties } from '@shared/domain/entity';
import { BaseFactory } from './base.factory';
import { courseFactory } from './course.factory';

class LessonFactory extends BaseFactory<LessonEntity, LessonProperties> {}

export const lessonFactory = LessonFactory.define(LessonEntity, ({ sequence }) => {
	const contents: ComponentProperties[] = [];
	if (contents) {
		contents.forEach((element) => {
			contents.push(element);
		});
	}

	return {
		name: `lesson #${sequence}`,
		course: courseFactory.build(),
		contents,
		hidden: false,
		materials: [],
	};
});
