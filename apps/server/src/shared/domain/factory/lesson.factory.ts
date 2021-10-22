import { courseFactory } from './course.factory';
import { Lesson, ILessonProperties } from '../entity/lesson.entity';
import { BaseFactory } from './base.factory';

export const lessonFactory = BaseFactory.define<Lesson, ILessonProperties>(Lesson, ({ sequence }) => {
	return {
		name: `lesson #${sequence}`,
		course: courseFactory.build(),
	};
});
