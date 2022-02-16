import { TaskWithStatusVo, Lesson } from '@shared/domain';

export type RoomBoardDTO = {
	roomId: string;
	displayColor: string;
	title: string;
	elements: RoomBoardElementDTO[];
};

export type RoomBoardElementDTO = {
	type: string;
	content: TaskWithStatusVo | Lesson;
};
