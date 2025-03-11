import { type CourseEntity } from '@modules/course/repo';
import { type User } from '@modules/user/repo';
import { EntityId } from '@shared/domain/types';

export type LessonCopyParams = {
	originalLessonId: EntityId;
	destinationCourse: CourseEntity;
	user: User;
	copyName?: string;
};
