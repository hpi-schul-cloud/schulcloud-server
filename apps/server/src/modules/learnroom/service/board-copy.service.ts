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
import { LessonCopyService } from './lesson-copy.service';
import { TaskCopyService } from './task-copy.service';

export type BoardCopyParams = {
	originalBoard: Board;
	destinationCourse: Course;
	user: User;
};

@Injectable()
export class BoardCopyService {
	constructor(
		private readonly boardRepo: BoardRepo,
		private readonly taskCopyService: TaskCopyService,
		private readonly lessonCopyService: LessonCopyService,
		private readonly copyHelperService: CopyHelperService
	) {}

	async copyBoard(params: BoardCopyParams): Promise<CopyStatus> {
		const elements: CopyStatus[] = [];
		const references: BoardElement[] = [];
		const { originalBoard, user, destinationCourse } = params;

		const boardElements = originalBoard.getElements();

		// WIP: refactor to do copy operations in parallel
		for (let i = 0; i < boardElements.length; i += 1) {
			const element = boardElements[i];

			if (element.boardElementType === BoardElementType.Task) {
				const originalTask = element.target as Task;
				// eslint-disable-next-line no-await-in-loop
				const status = await this.taskCopyService.copyTask({
					originalTask,
					user,
					destinationCourse,
				});
				elements.push(status);
				const taskBoardElement = BoardElement.FromTask(status.copyEntity as Task);
				references.push(taskBoardElement);
			} else if (element.boardElementType === BoardElementType.Lesson) {
				const originalLesson = element.target as Lesson;
				// eslint-disable-next-line no-await-in-loop
				const status = await this.lessonCopyService.copyLesson({
					originalLesson,
					user,
					destinationCourse,
				});
				elements.push(status);
				const lessonBardElement = BoardElement.FromLesson(status.copyEntity as Lesson);
				references.push(lessonBardElement);
			}
		}

		let boardCopy = new Board({ references, course: params.destinationCourse });
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

	async copyElementTask(element: BoardElement, user: User, destinationCourse: Course): Promise<CopyStatus> {
		const originalTask = element.target as Task;
		return this.taskCopyService.copyTask({
			originalTask,
			user,
			destinationCourse,
		});
	}

	updateCopiedEmbeddedTasksOfLessons(boardStatus: CopyStatus): CopyStatus {
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
}
