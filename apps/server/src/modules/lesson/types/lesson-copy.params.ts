import { Course } from '@shared/domain/entity/course.entity';
import { User } from '@shared/domain/entity/user.entity';
import { EntityId } from '@shared/domain/types/entity-id';

export type LessonCopyParams = {
	originalLessonId: EntityId;
	destinationCourse: Course;
	user: User;
	copyName?: string;
};
