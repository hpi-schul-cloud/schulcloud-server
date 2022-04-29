import { Lesson, TaskWithStatusVo } from '@shared/domain';

export type RoomBoardDTO = {
	roomId: string;
	displayColor: string;
	title: string;
	elements: RoomBoardElementDTO[];
};

export enum RoomBoardElementTypes {
	TASK = 'task',
	LESSON = 'lesson',
}

export type RoomBoardElementDTO = {
	type: RoomBoardElementTypes;
	content: TaskWithStatusVo | Lesson;
};
