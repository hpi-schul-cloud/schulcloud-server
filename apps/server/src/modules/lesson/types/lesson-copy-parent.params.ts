import { EntityId } from '@shared/domain/types/entity-id';

export type LessonCopyParentParams = {
	courseId?: EntityId;
	userId: string;
};
