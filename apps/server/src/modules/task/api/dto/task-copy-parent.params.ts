import { EntityId } from '@shared/domain/types';

// todo: it look like it is required not optional
export type TaskCopyParentParams = {
	courseId?: EntityId;
	lessonId?: EntityId;
	userId: string;
};
