import { Injectable } from '@nestjs/common';
import { ColumnBoard } from '@shared/domain/domainobject/board/column-board.do';
import { BoardExternalReferenceType } from '@shared/domain/domainobject/board/types/board-external-reference';
import { Course } from '@shared/domain/entity/course.entity';
import { Board } from '@shared/domain/entity/legacy-board/board.entity';
import { BoardElement, BoardElementType } from '@shared/domain/entity/legacy-board/boardelement.entity';
import { ColumnboardBoardElement } from '@shared/domain/entity/legacy-board/column-board-boardelement';
import { ColumnBoardTarget, isColumnBoardTarget } from '@shared/domain/entity/legacy-board/column-board-target.entity';
import { LessonBoardElement } from '@shared/domain/entity/legacy-board/lesson-boardelement.entity';
import { TaskBoardElement } from '@shared/domain/entity/legacy-board/task-boardelement.entity';
import { isLesson, LessonEntity } from '@shared/domain/entity/lesson.entity';
import { isTask, Task } from '@shared/domain/entity/task.entity';
import { User } from '@shared/domain/entity/user.entity';
import { BoardRepo } from '@shared/repo/board/board.repo';
import { LegacyLogger } from '@src/core/logger/legacy-logger.service';
import { ColumnBoardCopyService } from '@src/modules/board/service/column-board-copy.service';
import { CopyHelperService } from '@src/modules/copy-helper/service/copy-helper.service';
import { CopyElementType, CopyStatus, CopyStatusEnum } from '@src/modules/copy-helper/types/copy.types';
import { getResolvedValues } from '@src/modules/files-storage/helper/promise';
import { LessonCopyService } from '@src/modules/lesson/service/lesson-copy.service';
import { TaskCopyService } from '@src/modules/task/service/task-copy.service';

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

	private sortByOriginalOrder(resolved: [number, CopyStatus][]): CopyStatus[] {
		const sortByPos = sortBy(resolved, ([pos]) => pos);
		const statuses = sortByPos.map(([, status]) => status);
		return statuses;
	}
}
