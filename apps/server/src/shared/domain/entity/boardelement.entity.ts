import { Entity, Enum, ManyToOne } from '@mikro-orm/core';
import { Lesson } from './lesson.entity';
import { Task } from './task.entity';
import { EntityId } from '../types';
import { BaseEntityWithTimestamps } from './base.entity';

export type BoardElementReference = Task | Lesson;

export enum BoardElementType {
	'Task' = 'task',
	'Lesson' = 'lesson',
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

	static FromTask(task: Task): BoardElement {
		// eslint-disable-next-line @typescript-eslint/no-use-before-define
		const element = new TaskBoardElement({ target: task });
		return element;
	}

	static FromLesson(lesson: Lesson): BoardElement {
		// eslint-disable-next-line @typescript-eslint/no-use-before-define
		const element = new LessonBoardElement({ target: lesson });
		return element;
	}
}

@Entity({ discriminatorValue: BoardElementType.Task })
export class TaskBoardElement extends BoardElement {
	constructor(props: { target: Task }) {
		super(props);
		this.boardElementType = BoardElementType.Task;
	}

	@ManyToOne('Task')
	target!: Task;
}

@Entity({ discriminatorValue: BoardElementType.Lesson })
export class LessonBoardElement extends BoardElement {
	constructor(props: { target: Lesson }) {
		super(props);
		this.boardElementType = BoardElementType.Lesson;
	}

	@ManyToOne('Lesson')
	target!: Lesson;
}
