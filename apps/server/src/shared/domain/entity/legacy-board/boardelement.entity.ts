import { Entity, Enum } from '@mikro-orm/core';
import { EntityId } from '../../types';
import { BaseEntityWithTimestamps } from '../base.entity';
import { LessonEntity } from '../lesson.entity';
import { Task } from '../task.entity';
import { ColumnBoardTarget } from './column-board-target.entity';

export type BoardElementReference = Task | LessonEntity | ColumnBoardTarget;

export enum BoardElementType {
	'Task' = 'task',
	'Lesson' = 'lesson',
	'ColumnBoard' = 'columnboard',
}

export type BoardElementProps = {
	target: EntityId | BoardElementReference;
};

@Entity({
	discriminatorColumn: 'boardElementType',
	abstract: true,
})
export abstract class BoardElement extends BaseEntityWithTimestamps {
	/** id reference to a collection populated later with name */
	target!: BoardElementReference;

	/** name of a collection which is referenced in target */
	@Enum()
	boardElementType!: BoardElementType;

	constructor(props: BoardElementProps) {
		super();
		Object.assign(this, { target: props.target });
	}
}
