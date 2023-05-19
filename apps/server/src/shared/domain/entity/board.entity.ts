import { Collection, Entity, IdentifiedReference, ManyToMany, OneToOne, wrap } from '@mikro-orm/core';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ILearnroomElement } from '../interface';
import { EntityId } from '../types';
import { BaseEntityWithTimestamps } from './base.entity';
import { BoardElement, BoardElementTarget } from './boardelement.entity';
import type { Course } from './course.entity';

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

	@OneToOne({ type: 'Course', fieldName: 'courseId', wrappedReference: true, unique: true })
	course: IdentifiedReference<Course>;

	@ManyToMany('BoardElement', undefined, { fieldName: 'referenceIds' })
	references = new Collection<BoardElement>(this);

	getByTargetId(id: EntityId): ILearnroomElement {
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
		const firstSorted = [...first].sort();
		const secondSorted = [...second].sort();
		const isEqual = JSON.stringify(firstSorted) === JSON.stringify(secondSorted);
		return isEqual;
	}

	private getElementByTargetId(id: EntityId): BoardElement {
		const element = this.getElements().find((el) => el.target.id === id);
		if (!element) throw new NotFoundException('board does not contain such element');
		return element;
	}

	syncBoardElementReferences(boardElementTargets: BoardElementTarget[]) {
		this.removeDeletedReferences(boardElementTargets);
		this.appendNotContainedBoardElements(boardElementTargets);
	}

	private removeDeletedReferences(boardElementTargets: BoardElementTarget[]) {
		const references = this.references.getItems();
		const onlyExistingReferences = references.filter((ref) => boardElementTargets.includes(ref.target));
		this.references.set(onlyExistingReferences);
	}

	private appendNotContainedBoardElements(boardElementTargets: BoardElementTarget[]): void {
		const references = this.references.getItems();
		const isNotContained = (element) => !references.some((ref) => ref.target === element);
		const mapToBoardElement = (reference) => BoardElement.FromBoardElementReference(reference);
		const elementsToAdd = boardElementTargets.filter(isNotContained).map(mapToBoardElement);
		const newList = [...elementsToAdd, ...references];
		this.references.set(newList);
	}
}
