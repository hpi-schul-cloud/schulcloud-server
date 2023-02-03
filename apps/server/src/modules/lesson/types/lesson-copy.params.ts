import { EntityId, User } from '@shared/domain';

export type LessonCopyParams = {
	originalLessonId: EntityId;
	destinationCourseId: EntityId;
	user: User;
	copyName?: string;
};
