import { Lesson } from '@shared/domain';
import { ExtendedLesson } from '../types/extended-lesson';

export class ExtendedLessonMapper {
	static mapToExtendedLesson(aggregationResult: Record<string, never>): ExtendedLesson {
		const lesson = new Lesson({
			name: aggregationResult.name,
			hidden: aggregationResult.hidden,
			course: aggregationResult.course,
			position: aggregationResult.position,
			contents: [aggregationResult.contents],
		});

		lesson._id = aggregationResult._id;

		return new ExtendedLesson(lesson, aggregationResult.schoolId);
	}
}
