import { Lesson, ILessonProperties } from '@shared/domain';
import { courseFactory } from './course.factory';
import { BaseFactory } from './base.factory';

export const lessonFactory = BaseFactory.define<Lesson, ILessonProperties>(Lesson, ({ sequence }) => {
	return {
		name: `lesson #${sequence}`,
		course: courseFactory.build(),
	};
});
