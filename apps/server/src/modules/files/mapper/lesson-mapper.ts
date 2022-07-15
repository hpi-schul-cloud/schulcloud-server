import { Lesson } from '@shared/domain';

export class LessonMapper {
	static mapToLesson(aggregationResult: Record<string, never>): Lesson {
		const lesson = new Lesson({
			name: aggregationResult.name,
			hidden: aggregationResult.hidden,
			course: aggregationResult.course,
			position: aggregationResult.position,
			contents: [aggregationResult.contents],
		});

		lesson._id = aggregationResult._id;

		return lesson;
	}
}
