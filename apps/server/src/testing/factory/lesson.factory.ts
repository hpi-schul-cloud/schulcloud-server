// Remove the eslint-disable after fixing the import issue in EPIC-96
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { courseEntityFactory } from '@modules/course/testing';
import { ComponentProperties, LessonEntity, LessonProperties } from '@shared/domain/entity';
import { BaseFactory } from './base.factory';

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
		course: courseEntityFactory.build(),
		contents,
		hidden: false,
		materials: [],
	};
});
