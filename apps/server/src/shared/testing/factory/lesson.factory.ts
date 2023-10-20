import { Course, IComponentProperties, ILessonProperties, Lesson } from '@shared/domain';

import { BaseFactory } from './base.factory';
import { courseFactory } from './course.factory';

class LessonFactory extends BaseFactory<Lesson, ILessonProperties> {}

export const lessonFactory = LessonFactory.define<Lesson, ILessonProperties>(Lesson, ({ sequence, params }) => {
	let course: Course;
	if (params.course) {
		course = params.course as Course;
	} else {
		course = courseFactory.build();
	}

	const contents: IComponentProperties[] = [];
	if (params.contents) {
		params.contents.forEach((element) => {
			contents.push(element);
		});
	}

	const hidden = params.hidden || false;

	return {
		name: `lesson #${sequence}`,
		course,
		contents,
		hidden,
		materials: [],
	};
});
