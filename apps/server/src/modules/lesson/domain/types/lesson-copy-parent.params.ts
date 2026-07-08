import { type EntityId } from '@shared/domain/types';

export type LessonCopyParentParams = {
	courseId?: EntityId;
	userId: string;
};
