import { Entity, Collection, ManyToMany } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from './base.entity';
import { BoardElement, BoardElementType } from './boardelement.entity';
import type { Task } from './task.entity';
import type { Lesson } from './lesson.entity';

export type BoardProps = {
	references: BoardElement[];
};

@Entity({ tableName: 'board' })
export class Board extends BaseEntityWithTimestamps {
	constructor(props: BoardProps) {
		super();
		this.references.set(props.references);
	}

	@ManyToMany('BoardElement', undefined, { fieldName: 'referenceIds' })
	references = new Collection<BoardElement>(this);

	getElements() {
		return this.references.getItems();
	}

	syncTasksFromList(taskList: Task[]) {
		// should this be in an external domain service, to not having to know about tasks?
		this.removeTasksNotInList(taskList);
		this.addTasksOnList(taskList);
	}

	syncLessonsFromList(lessonList: Lesson[]) {
		this.removeLessonsNotInList(lessonList);
		this.addLessonsOnList(lessonList);
	}

	private removeTasksNotInList(taskList: Task[]) {
		const taskReferences = this.references.getItems().filter((ref) => ref.boardElementType === BoardElementType.Task);
		taskReferences.forEach((reference) => {
			// TODO: use typescript guard
			if (!taskList.includes(reference.target as Task)) {
				this.references.remove(reference);
			}
		});
	}

	private removeLessonsNotInList(lessonList: Lesson[]) {
		const lessonReferences = this.references
			.getItems()
			.filter((ref) => ref.boardElementType === BoardElementType.Lesson);
		lessonReferences.forEach((reference) => {
			// TODO: use typescript guard
			if (!lessonList.includes(reference.target as Lesson)) {
				this.references.remove(reference);
			}
		});
	}

	private addTasksOnList(taskList: Task[]) {
		taskList.forEach((task) => {
			const alreadyContained = this.references
				.getItems()
				.find((ref) => ref.boardElementType === BoardElementType.Task && ref.target === task);
			if (!alreadyContained) {
				this.references.add(BoardElement.FromTask(task));
			}
		});
	}

	private addLessonsOnList(lessonList: Lesson[]) {
		lessonList.forEach((lesson) => {
			const alreadyContained = this.references
				.getItems()
				.find((ref) => ref.boardElementType === BoardElementType.Lesson && ref.target === lesson);
			if (!alreadyContained) {
				this.references.add(BoardElement.FromLesson(lesson));
			}
		});
	}
}
