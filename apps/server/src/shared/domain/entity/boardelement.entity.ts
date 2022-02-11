import { Entity, Enum, ManyToOne } from '@mikro-orm/core';
import { Task, Lesson } from '.';
import { EntityId } from '..';
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
	discriminatorColumn: 'targetModel',
	abstract: true,
})
export abstract class BoardElement extends BaseEntityWithTimestamps {
	/** id reference to a collection populated later with name */
	target!: BoardElementReference;

	/** name of a collection which is referenced in target */
	@Enum()
	boardElementType!: BoardElementType;

	protected constructor(props: BoardElementProps) {
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
	@ManyToOne('Task')
	target!: Task;
}

@Entity({ discriminatorValue: BoardElementType.Task })
export class LessonBoardElement extends BoardElement {
	@ManyToOne('Lesson')
	target!: Lesson;
}
