import { ComponentProperties, Course, LessonEntity, LessonProperties } from '@shared/domain/entity';

import { BaseFactory } from './base.factory';
import { courseFactory } from './course.factory';

class LessonFactory extends BaseFactory<LessonEntity, LessonProperties> {}

export const lessonFactory = LessonFactory.define<LessonEntity, LessonProperties>(
	LessonEntity,
	({ sequence, params }) => {
		let course: Course;
		if (params.course) {
			course = params.course as Course;
		} else {
			course = courseFactory.build();
		}

		const contents: ComponentProperties[] = [];
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
	}
);
