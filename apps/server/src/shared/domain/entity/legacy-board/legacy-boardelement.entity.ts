import { Entity, Enum } from '@mikro-orm/core';
import { EntityId } from '../../types';
import { BaseEntityWithTimestamps } from '../base.entity';
import { ColumnBoardNode } from '../column-board-node.entity';
import { LessonEntity } from '../lesson.entity';
import { Task } from '../task.entity';

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
