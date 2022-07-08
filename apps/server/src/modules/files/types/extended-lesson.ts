import { EntityId, Lesson } from '@shared/domain';

export class ExtendedLesson {
	lesson: Lesson;

	schoolId: EntityId;

	constructor(lesson: Lesson, schoolId: EntityId) {
		this.lesson = lesson;
		this.schoolId = schoolId;
	}
}
