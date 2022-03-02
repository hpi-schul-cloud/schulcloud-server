import { TaskWithStatusVo, Lesson, EntityId, User } from '@shared/domain';

export type RoomBoardDTO = {
	roomId: string;
	displayColor: string;
	title: string;
	elements: RoomBoardElementDTO[];
};

export type TaskMetadataDTO = {
	id: EntityId;
	name: string;
	allowed: boolean;
};

export enum RoomBoardElementTypes {
	'Task' = 'task',
	'TaskMetadata' = 'taskMetadata',
	'Lesson' = 'lesson',
}

export type RoomBoardElementDTO = {
	type: RoomBoardElementTypes;
	content: TaskWithStatusVo | TaskMetadataDTO | Lesson;
};
