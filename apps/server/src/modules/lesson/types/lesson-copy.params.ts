import { User } from '@modules/user/repo';
import { Course } from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';

export type LessonCopyParams = {
	originalLessonId: EntityId;
	destinationCourse: Course;
	user: User;
	copyName?: string;
};
