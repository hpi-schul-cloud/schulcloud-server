import { Collection, Entity, Ref, ManyToMany, OneToOne, wrap } from '@mikro-orm/core';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { LearnroomElement } from '../../interface';
import { EntityId } from '../../types';
import { BaseEntityWithTimestamps } from '../base.entity';
import type { Course } from '../course.entity';
import { LessonEntity } from '../lesson.entity';
import { Task } from '../task.entity';
import { BoardElement, BoardElementReference } from './boardelement.entity';
import { ColumnboardBoardElement } from './column-board-boardelement';
import { ColumnBoardTarget } from './column-board-target.entity';
import { LessonBoardElement } from './lesson-boardelement.entity';
import { TaskBoardElement } from './task-boardelement.entity';

export type BoardProps = {
	references: BoardElement[];
	course: Course;
};

@Entity({ tableName: 'board' })
export class Board extends BaseEntityWithTimestamps {
	constructor(props: BoardProps) {
		super();
		this.references.set(props.references);
		this.course = wrap(props.course).toReference();
	}

	@OneToOne({ type: 'Course', fieldName: 'courseId', ref: true, unique: true, owner: true })
	course: Ref<Course>;

	@ManyToMany('BoardElement', undefined, { fieldName: 'referenceIds' })
	references = new Collection<BoardElement>(this);

	getByTargetId(id: EntityId): LearnroomElement {
		const element = this.getElementByTargetId(id);
		return element.target;
	}

	getElements() {
		return this.references.getItems();
	}

	reorderElements(ids: EntityId[]) {
		this.validateReordering(ids);

		const elements = ids.map((id) => this.getElementByTargetId(id));

		this.references.set(elements);
	}

	private validateReordering(reorderedIds: EntityId[]) {
		const existingElements = this.getElements().map((el) => el.target.id);
		const listsEqual = this.checkListsContainingEqualEntities(reorderedIds, existingElements);
		if (!listsEqual) {
			throw new BadRequestException('elements did not match. please fetch the elements of the board before reordering');
		}
	}

	private checkListsContainingEqualEntities(first: EntityId[], second: EntityId[]): boolean {
		const compareAlphabetic = (a, b) => (a < b ? -1 : 1);
		const firstSorted = [...first].sort(compareAlphabetic);
		const secondSorted = [...second].sort(compareAlphabetic);
		const isEqual = JSON.stringify(firstSorted) === JSON.stringify(secondSorted);
		return isEqual;
	}

	private getElementByTargetId(id: EntityId): BoardElement {
		const element = this.getElements().find((el) => el.target.id === id);
		if (!element) throw new NotFoundException('board does not contain such element');
		return element;
	}

	syncBoardElementReferences(boardElementTargets: BoardElementReference[]) {
		this.removeDeletedReferences(boardElementTargets);
		this.appendNotContainedBoardElements(boardElementTargets);
	}

	private removeDeletedReferences(boardElementTargets: BoardElementReference[]) {
		const references = this.references.getItems();
		const onlyExistingReferences = references.filter((ref) => boardElementTargets.includes(ref.target));
		this.references.set(onlyExistingReferences);
	}

	private appendNotContainedBoardElements(boardElementTargets: BoardElementReference[]): void {
		const references = this.references.getItems();
		const isNotContained = (element: BoardElementReference) => !references.some((ref) => ref.target === element);
		const mapToBoardElement = (target: BoardElementReference) => this.createBoardElementFor(target);

		const elementsToAdd = boardElementTargets.filter(isNotContained).map(mapToBoardElement);
		const newList = [...elementsToAdd, ...references];
		this.references.set(newList);
	}

	private createBoardElementFor(boardElementTarget: BoardElementReference): BoardElement {
		if (boardElementTarget instanceof Task) {
			return new TaskBoardElement({ target: boardElementTarget });
		}
		if (boardElementTarget instanceof LessonEntity) {
			return new LessonBoardElement({ target: boardElementTarget });
		}
		if (boardElementTarget instanceof ColumnBoardTarget) {
			return new ColumnboardBoardElement({ target: boardElementTarget });
		}
		throw new Error('not a valid boardElementReference');
	}
}
