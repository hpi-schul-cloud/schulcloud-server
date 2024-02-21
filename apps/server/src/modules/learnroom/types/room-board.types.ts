import { TaskWithStatusVo } from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';

export type RoomBoardDTO = {
	roomId: string;
	displayColor: string;
	title: string;
	elements: RoomBoardElementDTO[];
	isArchived: boolean;
};

export enum RoomBoardElementTypes {
	TASK = 'task',
	LESSON = 'lesson',
	COLUMN_BOARD = 'column-board',
}

export type LessonMetaData = {
	id: EntityId;
	name: string;
	hidden: boolean;
	createdAt: Date;
	updatedAt: Date;
	numberOfPublishedTasks: number;
	numberOfDraftTasks?: number;
	numberOfPlannedTasks?: number;
	courseName: string;
};

export type ColumnBoardMetaData = {
	id: EntityId;
	columnBoardId: EntityId;
	title: string;
	published: boolean;
	createdAt: Date;
	updatedAt: Date;
};

export type RoomBoardElementDTO = {
	type: RoomBoardElementTypes;
	content: TaskWithStatusVo | LessonMetaData | ColumnBoardMetaData;
};
