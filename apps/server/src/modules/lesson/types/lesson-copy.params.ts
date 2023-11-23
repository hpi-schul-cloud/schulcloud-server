import { Course, User } from '@shared/domain';
import { EntityId } from '@shared/domain/types';

export type LessonCopyParams = {
	originalLessonId: EntityId;
	destinationCourse: Course;
	user: User;
	copyName?: string;
};
