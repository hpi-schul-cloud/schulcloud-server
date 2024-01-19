import { Course, User } from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';

export type LessonCopyParams = {
	originalLessonId: EntityId;
	destinationCourse: Course;
	user: User;
	copyName?: string;
};
