import { BoardLayout } from '@modules/board';
import { LessonEntity } from '@modules/lesson/repo';
import { Task, TaskWithStatusVo } from '@modules/task/repo';
import { EntityId } from '@shared/domain/types';

export type RoomBoardDTO = {
	roomId: string;
	displayColor: string;
	title: string;
	elements: RoomBoardElementDTO[];
	isArchived: boolean;
	isSynchronized: boolean;
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
	layout: BoardLayout;
};

export type RoomBoardElementDTO = {
	type: RoomBoardElementTypes;
	content: TaskWithStatusVo | LessonMetaData | ColumnBoardMetaData;
};

export type ColumnBoardNode = {
	id: EntityId;
	title: EntityId;
	isVisible: boolean;
	layout: BoardLayout;
	createdAt: Date;
	updatedAt: Date;
};

export const isTask = (target: unknown): target is Task =>
	typeof target === 'object' && target !== null && target['constructor']?.name === 'Task';

export const isLesson = (target: unknown): target is LessonEntity =>
	typeof target === 'object' && target !== null && target['constructor']?.name === 'LessonEntity';

export const isColumnBoard = (target: unknown): target is ColumnBoardNode =>
	typeof target === 'object' && target !== null && target['constructor']?.name === 'BoardNodeEntity';
