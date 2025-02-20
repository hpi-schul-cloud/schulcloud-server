import { CourseEntity } from '@modules/course/repo';
import { User } from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';

export type LessonCopyParams = {
	originalLessonId: EntityId;
	destinationCourse: CourseEntity;
	user: User;
	copyName?: string;
};
