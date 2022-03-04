import { TaskWithStatusVo, Lesson, EntityId } from '@shared/domain';

export type RoomBoardDTO = {
	roomId: string;
	displayColor: string;
	title: string;
	elements: RoomBoardElementDTO[];
};

export type LockedTaskDTO = {
	id: EntityId;
	name: string;
	allowed: boolean;
};

export enum RoomBoardElementTypes {
	'Task' = 'task',
	'LockedTask' = 'lockedtask',
	'Lesson' = 'lesson',
}

export type RoomBoardElementDTO = {
	type: RoomBoardElementTypes;
	content: TaskWithStatusVo | LockedTaskDTO | Lesson;
};
