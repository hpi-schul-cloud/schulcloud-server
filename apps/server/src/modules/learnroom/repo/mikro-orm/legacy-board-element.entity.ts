import { Entity, Enum } from '@mikro-orm/core';
import { LessonEntity } from '@modules/lesson/repo';
import { Task } from '@modules/task/repo';
import { BaseEntityWithTimestamps } from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';
import { ColumnBoardNode } from './column-board-node.entity';

export type LegacyBoardElementReference = Task | LessonEntity | ColumnBoardNode;

export enum LegacyBoardElementType {
	'Task' = 'task',
	'Lesson' = 'lesson',
	'ColumnBoard' = 'columnboard',
}

export type LegacyBoardElementProps = {
	target: EntityId | LegacyBoardElementReference;
};

@Entity({
	discriminatorColumn: 'boardElementType',
	abstract: true,
	tableName: 'board-element',
})
export abstract class LegacyBoardElement extends BaseEntityWithTimestamps {
	/** id reference to a collection populated later with name */
	target!: LegacyBoardElementReference;

	/** name of a collection which is referenced in target */
	@Enum()
	boardElementType!: LegacyBoardElementType;

	constructor(props: LegacyBoardElementProps) {
		super();
		Object.assign(this, { target: props.target });
	}
}
