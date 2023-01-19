import { EntityId } from '@shared/domain';

// todo: it look like it is required not optional
export type TaskCopyParentParams = {
	courseId?: EntityId;
	lessonId?: EntityId;
	userId: string;
};
