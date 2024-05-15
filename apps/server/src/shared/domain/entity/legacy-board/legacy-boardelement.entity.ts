import { Entity, Enum } from '@mikro-orm/core';
import { ColumnBoard } from '@modules/board';
import { BaseEntityWithTimestamps } from '../base.entity';
import { LessonEntity } from '../lesson.entity';
import { Task } from '../task.entity';

export type LegacyBoardElementReference = Task | LessonEntity | ColumnBoard;

export enum LegacyBoardElementType {
	'Task' = 'task',
	'Lesson' = 'lesson',
	'ColumnBoard' = 'columnboard',
}

@Entity({
	discriminatorColumn: 'boardElementType',
	abstract: true,
	tableName: 'board-element',
})
export abstract class LegacyBoardElement extends BaseEntityWithTimestamps {
	/** id reference to a collection populated later with name */
	abstract get target(): LegacyBoardElementReference;

	/** name of a collection which is referenced in target */
	@Enum()
	boardElementType!: LegacyBoardElementType;
}
