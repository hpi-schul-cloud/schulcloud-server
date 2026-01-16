import { Collection, Entity, ManyToMany, OneToOne, Ref, wrap } from '@mikro-orm/core';
import type { BoardNodeEntity } from '@modules/board/repo/entity/board-node.entity';
import { CourseEntity } from '@modules/course/repo';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { BaseEntityWithTimestamps } from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';
import { isColumnBoard, isLesson, isTask, LearnroomElement } from '../../types';
import { ColumnBoardBoardElement } from './column-board-board-element.entity';
import { LegacyBoardElement, LegacyBoardElementReference } from './legacy-board-element.entity';
import { LessonBoardElement } from './lesson-board-element.entity';
import { TaskBoardElement } from './task-board-element.entity';

export type BoardProps = {
	references: LegacyBoardElement[];
	course: CourseEntity;
};

@Entity({ tableName: 'board' })
export class LegacyBoard extends BaseEntityWithTimestamps {
	constructor(props: BoardProps) {
		super();
		this.references.set(props.references);
		this.course = wrap(props.course).toReference();
	}

	@OneToOne({ entity: () => CourseEntity, fieldName: 'courseId', ref: true, unique: true, owner: true })
	course: Ref<CourseEntity>;

	@ManyToMany('LegacyBoardElement', undefined, { fieldName: 'referenceIds' })
	references = new Collection<LegacyBoardElement>(this);

	public getByTargetId(id: EntityId): LearnroomElement {
		const element = this.getElementByTargetId(id);

		return element.target as LearnroomElement;
	}

	public getElements(): LegacyBoardElement[] {
		return this.references.getItems();
	}

	public reorderElements(ids: EntityId[]): void {
		this.validateReordering(ids);

		const elements = ids.map((id) => this.getElementByTargetId(id));

		this.references.set(elements);
	}

	private validateReordering(reorderedIds: EntityId[]): void {
		const existingElements = this.getElements().map((el) => el.target.id);
		const listsEqual = this.checkListsContainingEqualEntities(reorderedIds, existingElements);
		if (!listsEqual) {
			throw new BadRequestException('elements did not match. please fetch the elements of the board before reordering');
		}
	}

	private checkListsContainingEqualEntities(first: EntityId[], second: EntityId[]): boolean {
		const compareAlphabetic = (a: EntityId, b: EntityId): number => (a < b ? -1 : 1);
		const firstSorted = [...first].sort(compareAlphabetic);
		const secondSorted = [...second].sort(compareAlphabetic);
		const isEqual = JSON.stringify(firstSorted) === JSON.stringify(secondSorted);
		return isEqual;
	}

	private getElementByTargetId(id: EntityId): LegacyBoardElement {
		const element = this.getElements().find((el) => el.target.id === id);
		if (!element) throw new NotFoundException('board does not contain such element');
		return element;
	}

	public syncBoardElementReferences(boardElementTargets: LegacyBoardElementReference[]): void {
		this.removeDeletedReferences(boardElementTargets);
		this.appendNotContainedBoardElements(boardElementTargets);
	}

	private removeDeletedReferences(boardElementTargets: LegacyBoardElementReference[]): void {
		const references = this.references.getItems();
		const onlyExistingReferences = references.filter((ref) => boardElementTargets.includes(ref.target));
		this.references.set(onlyExistingReferences);
	}

	private appendNotContainedBoardElements(boardElementTargets: LegacyBoardElementReference[]): void {
		const references = this.references.getItems();
		const isNotContained = (element: LegacyBoardElementReference): boolean =>
			!references.some((ref) => ref.target === element);
		const mapToBoardElement = (target: LegacyBoardElementReference): LegacyBoardElement =>
			this.createBoardElementFor(target);

		const elementsToAdd = boardElementTargets.filter(isNotContained).map(mapToBoardElement);
		const newList = [...elementsToAdd, ...references];
		this.references.set(newList);
	}

	private createBoardElementFor(boardElementTarget: LegacyBoardElementReference): LegacyBoardElement {
		if (isTask(boardElementTarget)) {
			return new TaskBoardElement({ target: boardElementTarget });
		}
		if (isLesson(boardElementTarget)) {
			return new LessonBoardElement({ target: boardElementTarget });
		}
		if (isColumnBoard(boardElementTarget)) {
			return new ColumnBoardBoardElement({ target: boardElementTarget as BoardNodeEntity });
		}
		throw new Error('not a valid boardElementReference');
	}
}
