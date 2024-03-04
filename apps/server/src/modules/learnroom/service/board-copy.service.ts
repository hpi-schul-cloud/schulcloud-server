import { ColumnBoardCopyService } from '@modules/board';
import { CopyElementType, CopyHelperService, CopyStatus, CopyStatusEnum } from '@modules/copy-helper';
import { LessonCopyService } from '@modules/lesson';
import { TaskCopyService } from '@modules/task';
import { Injectable } from '@nestjs/common';
import { getResolvedValues } from '@shared/common/utils/promise';
import { ColumnBoard } from '@shared/domain/domainobject';
import { BoardExternalReferenceType } from '@shared/domain/domainobject/board/types';
import {
	Board,
	BoardElement,
	BoardElementType,
	ColumnboardBoardElement,
	ColumnBoardTarget,
	Course,
	isColumnBoardTarget,
	isLesson,
	isTask,
	LessonBoardElement,
	LessonEntity,
	Task,
	TaskBoardElement,
	User,
} from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';
import { BoardRepo } from '@shared/repo';
import { LegacyLogger } from '@src/core/logger';
import { sortBy } from 'lodash';

type BoardCopyParams = {
	originalBoard: Board;
	destinationCourse: Course;
	user: User;
};

@Injectable()
export class BoardCopyService {
	constructor(
		private readonly logger: LegacyLogger,
		private readonly boardRepo: BoardRepo,
		private readonly taskCopyService: TaskCopyService,
		private readonly lessonCopyService: LessonCopyService,
		private readonly columnBoardCopyService: ColumnBoardCopyService,
		private readonly copyHelperService: CopyHelperService
	) {}

	async copyBoard(params: BoardCopyParams): Promise<CopyStatus> {
		const { originalBoard, user, destinationCourse } = params;

		const boardElements: BoardElement[] = originalBoard.getElements();
		const elements: CopyStatus[] = await this.copyBoardElements(boardElements, user, destinationCourse);
		const references: BoardElement[] = this.extractReferences(elements);

		let boardCopy: Board = new Board({ references, course: destinationCourse });
		let status: CopyStatus = {
			title: 'board',
			type: CopyElementType.BOARD,
			status: this.copyHelperService.deriveStatusFromElements(elements),
			copyEntity: boardCopy,
			originalEntity: params.originalBoard,
			elements,
		};

		status = this.updateCopiedEmbeddedTasksOfLessons(status);
		if (status.copyEntity) {
			boardCopy = status.copyEntity as Board;
		}

		status = await this.swapLinkedIdsInBoards(status);

		try {
			await this.boardRepo.save(boardCopy);
		} catch (err) {
			this.logger.warn(err);
			status.status = CopyStatusEnum.FAIL;
		}

		return status;
	}

	private async copyBoardElements(
		boardElements: BoardElement[],
		user: User,
		destinationCourse: Course
	): Promise<CopyStatus[]> {
		const promises: Promise<[number, CopyStatus]>[] = boardElements.map((element, pos) => {
			if (element.target === undefined) {
				return Promise.reject(new Error('Broken boardelement - not pointing to any target entity'));
			}

			if (element.boardElementType === BoardElementType.Task && isTask(element.target)) {
				return this.copyTask(element.target, user, destinationCourse).then((status) => [pos, status]);
			}

			if (element.boardElementType === BoardElementType.Lesson && isLesson(element.target)) {
				return this.copyLesson(element.target, user, destinationCourse).then((status) => [pos, status]);
			}

			if (element.boardElementType === BoardElementType.ColumnBoard && isColumnBoardTarget(element.target)) {
				return this.copyColumnBoard(element.target, user, destinationCourse).then((status) => [pos, status]);
			}

			/* istanbul ignore next */
			this.logger.warn(`BoardCopyService unable to handle boardElementType.`);
			/* istanbul ignore next */
			return Promise.reject(new Error(`BoardCopyService unable to handle boardElementType.`));
		});

		const results = await Promise.allSettled(promises);
		const resolved: Array<[number, CopyStatus]> = getResolvedValues(results);
		const statuses: CopyStatus[] = this.sortByOriginalOrder(resolved);
		return statuses;
	}

	private async copyLesson(originalLesson: LessonEntity, user: User, destinationCourse: Course): Promise<CopyStatus> {
		return this.lessonCopyService.copyLesson({
			originalLessonId: originalLesson.id,
			user,
			destinationCourse,
		});
	}

	private async copyTask(originalTask: Task, user: User, destinationCourse: Course): Promise<CopyStatus> {
		return this.taskCopyService.copyTask({
			originalTaskId: originalTask.id,
			user,
			destinationCourse,
		});
	}

	private async copyColumnBoard(
		columnBoardTarget: ColumnBoardTarget,
		user: User,
		destinationCourse: Course
	): Promise<CopyStatus> {
		return this.columnBoardCopyService.copyColumnBoard({
			originalColumnBoardId: columnBoardTarget.columnBoardId,
			userId: user.id,
			destinationExternalReference: {
				id: destinationCourse.id,
				type: BoardExternalReferenceType.Course,
			},
		});
	}

	private extractReferences(statuses: CopyStatus[]): BoardElement[] {
		const references: BoardElement[] = [];
		statuses.forEach((status) => {
			if (status.copyEntity instanceof Task) {
				const taskElement = new TaskBoardElement({ target: status.copyEntity });
				references.push(taskElement);
			}
			if (status.copyEntity instanceof LessonEntity) {
				const lessonElement = new LessonBoardElement({ target: status.copyEntity });
				references.push(lessonElement);
			}
			if (status.copyEntity instanceof ColumnBoard) {
				const columnBoardElement = new ColumnboardBoardElement({
					target: new ColumnBoardTarget({ columnBoardId: status.copyEntity.id, title: status.copyEntity.title }),
				});
				references.push(columnBoardElement);
			}
		});
		return references;
	}

	private updateCopiedEmbeddedTasksOfLessons(boardStatus: CopyStatus): CopyStatus {
		const copyDict = this.copyHelperService.buildCopyEntityDict(boardStatus);
		const elements = boardStatus.elements ?? [];
		const updatedElements = elements.map((elementCopyStatus) => {
			if (elementCopyStatus.type === CopyElementType.LESSON) {
				return this.lessonCopyService.updateCopiedEmbeddedTasks(elementCopyStatus, copyDict);
			}
			return elementCopyStatus;
		});
		boardStatus.elements = updatedElements;
		return boardStatus;
	}

	private async swapLinkedIdsInBoards(copyStatus: CopyStatus): Promise<CopyStatus> {
		const map = new Map<EntityId, EntityId>();
		const copyDict = this.copyHelperService.buildCopyEntityDict(copyStatus);
		copyDict.forEach((value, key) => map.set(key, value.id));

		if (copyStatus.copyEntity instanceof Board && copyStatus.originalEntity instanceof Board) {
			map.set(copyStatus.originalEntity.course.id, copyStatus.copyEntity.course.id);
		}

		const elements = copyStatus.elements ?? [];
		const updatedElements = await Promise.all(
			elements.map(async (el) => {
				if (el.type === CopyElementType.COLUMNBOARD && el.copyEntity) {
					el.copyEntity = await this.columnBoardCopyService.swapLinkedIds(el.copyEntity?.id, map);
				}
				return el;
			})
		);

		copyStatus.elements = updatedElements;
		return copyStatus;
	}

	private sortByOriginalOrder(resolved: [number, CopyStatus][]): CopyStatus[] {
		const sortByPos = sortBy(resolved, ([pos]) => pos);
		const statuses = sortByPos.map(([, status]) => status);
		return statuses;
	}
}
