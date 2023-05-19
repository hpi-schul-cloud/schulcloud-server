import { Entity, Enum, ManyToOne } from '@mikro-orm/core';
import { ColumnBoard } from '../domainobject';
import { EntityId } from '../types';
import { BaseEntityWithTimestamps } from './base.entity';
import { Lesson } from './lesson.entity';
import { Task } from './task.entity';

export type BoardElementTarget = Task | Lesson | ColumnBoard;

export enum BoardElementType {
	'Task' = 'task',
	'Lesson' = 'lesson',
	'ColumnBoard' = 'columnboard',
}

export type BoardElementProps = {
	target: EntityId | BoardElementTarget;
};

@Entity({
	discriminatorColumn: 'boardElementType',
	abstract: true,
})
export abstract class BoardElement extends BaseEntityWithTimestamps {
	/** id reference to a collection populated later with name */
	target!: BoardElementTarget;

	/** name of a collection which is referenced in target */
	@Enum()
	boardElementType!: BoardElementType;

	constructor(props: BoardElementProps) {
		super();
		Object.assign(this, { target: props.target });
	}

	static FromBoardElementReference(boardElementTarget: BoardElementTarget): BoardElement {
		if (boardElementTarget instanceof Task) {
			return BoardElement.FromTask(boardElementTarget);
		} else if (boardElementTarget instanceof Lesson) {
			return BoardElement.FromLesson(boardElementTarget);
		} else if (boardElementTarget instanceof ColumnBoard) {
			return BoardElement.FromColumnBoard(boardElementTarget);
		} else {
			throw new Error('not a valid boardElementReference');
		}
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

	static FromColumnBoard(columnBoard: ColumnBoard): BoardElement {
		// eslint-disable-next-line @typescript-eslint/no-use-before-define
		const element = new ColumnboardBoardElement({ target: columnBoard });
		return element;
	}
}

@Entity({ discriminatorValue: BoardElementType.Task })
export class TaskBoardElement extends BoardElement {
	constructor(props: { target: Task }) {
		super(props);
		this.boardElementType = BoardElementType.Task;
	}

	// FIXME Due to a weird behaviour in the mikro-orm validation we have to
	// disable the validation by setting the reference nullable.
	// Remove when fixed in mikro-orm.
	@ManyToOne('Task', { nullable: true })
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

@Entity({ discriminatorValue: BoardElementType.ColumnBoard })
export class ColumnboardBoardElement extends BoardElement {
	constructor(props: { target: ColumnBoard }) {
		super(props);
		this.boardElementType = BoardElementType.ColumnBoard;
	}

	@ManyToOne('ColumnBoard')
	target!: ColumnBoard;
}
