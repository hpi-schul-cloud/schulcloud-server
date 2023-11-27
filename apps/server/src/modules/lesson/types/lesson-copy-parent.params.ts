import { EntityId } from '@shared/domain';

export type LessonCopyParentParams = {
	courseId?: EntityId;
	userId: string;
};
