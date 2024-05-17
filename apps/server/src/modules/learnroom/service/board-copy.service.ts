import { EntityManager } from '@mikro-orm/mongodb';
import { BoardExternalReferenceType, ColumnBoard } from '@modules/board/domain';
import { ColumnBoardCopyService } from '@modules/board/service';
import { CopyElementType, CopyHelperService, CopyStatus, CopyStatusEnum } from '@modules/copy-helper';
import { LessonCopyService } from '@modules/lesson';
import { TaskCopyService } from '@modules/task';
import { Injectable } from '@nestjs/common';
import { getResolvedValues } from '@shared/common/utils/promise';
import {
	ColumnboardBoardElement,
	ColumnBoardNode,
	Course,
	isLesson,
	isTask,
	LegacyBoard,
	LegacyBoardElement,
	LegacyBoardElementType,
	LessonBoardElement,
	LessonEntity,
	Task,
	TaskBoardElement,
	User,
} from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';
import { ColumnBoardNodeRepo, LegacyBoardRepo } from '@shared/repo';
import { LegacyLogger } from '@src/core/logger';
import { ColumnBoardLinkService } from '@src/modules/board/service';
import { sortBy } from 'lodash';

type BoardCopyParams = {
	originalBoard: LegacyBoard;
	destinationCourse: Course;
	user: User;
};

@Injectable()
export class BoardCopyService {
	constructor(
		private readonly logger: LegacyLogger,
		private readonly boardRepo: LegacyBoardRepo,
		private readonly taskCopyService: TaskCopyService,
		private readonly lessonCopyService: LessonCopyService,
		private readonly columnBoardCopyService: ColumnBoardCopyService,
		private readonly columnBoardLinkService: ColumnBoardLinkService,
		private readonly copyHelperService: CopyHelperService,
		// TODO comment this, legacy!
		private readonly columnBoardNodeRepo: ColumnBoardNodeRepo
	) {}

	async copyBoard(params: BoardCopyParams): Promise<CopyStatus> {
		const { originalBoard, user, destinationCourse } = params;

		const boardElements: LegacyBoardElement[] = originalBoard.getElements();
		const elements: CopyStatus[] = await this.copyBoardElements(boardElements, user, destinationCourse);

		const references: LegacyBoardElement[] = await this.extractReferences(elements);

		let boardCopy: LegacyBoard = new LegacyBoard({ references, course: destinationCourse });
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
			boardCopy = status.copyEntity as LegacyBoard;
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
		boardElements: LegacyBoardElement[],
		user: User,
		destinationCourse: Course
	): Promise<CopyStatus[]> {
		const promises: Promise<[number, CopyStatus]>[] = boardElements.map((element, pos) => {
			if (element.target === undefined) {
				return Promise.reject(new Error('Broken boardelement - not pointing to any target entity'));
			}

			if (element.boardElementType === LegacyBoardElementType.Task && isTask(element.target)) {
				return this.copyTask(element.target, user, destinationCourse).then((status) => [pos, status]);
			}

			if (element.boardElementType === LegacyBoardElementType.Lesson && isLesson(element.target)) {
				return this.copyLesson(element.target, user, destinationCourse).then((status) => [pos, status]);
			}

			if (element.boardElementType === LegacyBoardElementType.ColumnBoard && element.target instanceof ColumnBoard) {
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

	private async copyColumnBoard(columnBoard: ColumnBoard, user: User, destinationCourse: Course): Promise<CopyStatus> {
		return this.columnBoardCopyService.copyColumnBoard({
			originalColumnBoardId: columnBoard.id,
			userId: user.id,
			destinationExternalReference: {
				id: destinationCourse.id,
				type: BoardExternalReferenceType.Course,
			},
		});
	}

	private async extractReferences(statuses: CopyStatus[]): Promise<LegacyBoardElement[]> {
		const references: LegacyBoardElement[] = [];
		for (const status of statuses) {
			// statuses.forEach((status) => {
			if (status.copyEntity instanceof Task) {
				const taskElement = new TaskBoardElement({ target: status.copyEntity });
				references.push(taskElement);
			}
			if (status.copyEntity instanceof LessonEntity) {
				const lessonElement = new LessonBoardElement({ target: status.copyEntity });
				references.push(lessonElement);
			}
			if (status.copyEntity instanceof ColumnBoard) {
				// TODO comment this, legacy!
				// eslint-disable-next-line no-await-in-loop
				const columnBoardNode = await this.columnBoardNodeRepo.findById(status.copyEntity.id);
				const columnBoardElement = new ColumnboardBoardElement({
					target: columnBoardNode,
				});
				references.push(columnBoardElement);
			}
		}
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

		if (copyStatus.copyEntity instanceof LegacyBoard && copyStatus.originalEntity instanceof LegacyBoard) {
			map.set(copyStatus.originalEntity.course.id, copyStatus.copyEntity.course.id);
		}

		const elements = copyStatus.elements ?? [];
		const updatedElements = await Promise.all(
			elements.map(async (el) => {
				if (el.type === CopyElementType.COLUMNBOARD && el.copyEntity) {
					el.copyEntity = await this.columnBoardLinkService.swapLinkedIds(el.copyEntity?.id, map);
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
