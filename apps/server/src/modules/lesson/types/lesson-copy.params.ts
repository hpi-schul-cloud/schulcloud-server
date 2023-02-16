import { Course, EntityId, User } from '@shared/domain';

export type LessonCopyParams = {
	originalLessonId: EntityId;
	destinationCourse: Course;
	user: User;
	copyName?: string;
};
