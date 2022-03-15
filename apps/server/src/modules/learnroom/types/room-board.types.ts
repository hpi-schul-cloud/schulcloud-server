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
};

export enum RoomBoardElementTypes {
	TASK = 'task',
	LOCKEDTASK = 'lockedtask',
	LESSON = 'lesson',
}

export type RoomBoardElementDTO = {
	type: RoomBoardElementTypes;
	content: TaskWithStatusVo | LockedTaskDTO | Lesson;
};
