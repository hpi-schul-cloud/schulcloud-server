import { Injectable } from '@nestjs/common';
import {
	Board,
	BoardElement,
	BoardElementType,
	CopyElementType,
	CopyHelperService,
	CopyStatus,
	Course,
	Lesson,
	Task,
	User,
} from '@shared/domain';
import { BoardRepo } from '@shared/repo';
import { Logger } from '@src/core/logger';
import { getResolvedValues } from '@src/modules/files-storage/helper';
import { sortBy } from 'lodash';
import { LessonCopyService } from './lesson-copy.service';
import { TaskCopyService } from './task-copy.service';

type BoardCopyParams = {
	originalBoard: Board;
	destinationCourse: Course;
	user: User;
};

@Injectable()
export class BoardCopyService {
	constructor(
		private readonly logger: Logger,
		private readonly boardRepo: BoardRepo,
		private readonly taskCopyService: TaskCopyService,
		private readonly lessonCopyService: LessonCopyService,
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
		await this.boardRepo.save(boardCopy);

		return status;
	}

	private async copyBoardElements(
		boardElements: BoardElement[],
		user: User,
		destinationCourse: Course
	): Promise<CopyStatus[]> {
		const promises: Promise<[number, CopyStatus]>[] = boardElements.map((element, pos) => {
			if (element.boardElementType === BoardElementType.Task) {
				const originalTask = element.target as Task;
				return this.taskCopyService
					.copyTask({
						originalTask,
						user,
						destinationCourse,
					})
					.then((status) => [pos, status]);
			}
			if (element.boardElementType === BoardElementType.Lesson) {
				const originalLesson = element.target as Lesson;
				return this.lessonCopyService
					.copyLesson({
						originalLesson,
						user,
						destinationCourse,
					})
					.then((status) => [pos, status]);
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

	private extractReferences(statuses: CopyStatus[]): BoardElement[] {
		const references: BoardElement[] = [];
		statuses.forEach((status) => {
			if (status.copyEntity instanceof Task) {
				references.push(BoardElement.FromTask(status.copyEntity));
			}
			if (status.copyEntity instanceof Lesson) {
				references.push(BoardElement.FromLesson(status.copyEntity));
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
