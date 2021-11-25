import { Lesson, ILessonProperties, Course } from '@shared/domain';

import { courseFactory } from './course.factory';
import { BaseFactory } from './base.factory';

class LessonFactory extends BaseFactory<Lesson, ILessonProperties> {}

export const lessonFactory = LessonFactory.define<Lesson, ILessonProperties>(Lesson, ({ sequence, params }) => {
	let course: Course;
	if (params.course) {
		course = params.course as Course;
	} else {
		course = courseFactory.build();
	}

	return {
		name: `lesson #${sequence}`,
		course,
	};
});
