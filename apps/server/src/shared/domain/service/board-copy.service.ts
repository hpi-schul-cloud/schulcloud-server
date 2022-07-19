import { Injectable } from '@nestjs/common';
import { Board, BoardElement, BoardElementType, Course, Lesson, Task, User } from '../entity';
import { CopyElementType, CopyStatus } from '../types';
import { CopyHelperService } from './copy-helper.service';
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
		private readonly taskCopyService: TaskCopyService,
		private readonly lessonCopyService: LessonCopyService,
		private readonly copyHelperService: CopyHelperService
	) {}

	async copyBoard(params: BoardCopyParams): Promise<CopyStatus> {
		const elements: CopyStatus[] = [];
		const references: BoardElement[] = [];

		const boardElements = params.originalBoard.getElements();
		for (let i = 0; i < boardElements.length; i += 1) {
			const element = boardElements[i];

			if (element.boardElementType === BoardElementType.Task) {
				const originalTask = element.target as Task;
				const status = this.taskCopyService.copyTaskMetadata({
					originalTask,
					user: params.user,
					destinationCourse: params.destinationCourse,
				});
				elements.push(status);
				const taskBoardElement = BoardElement.FromTask(status.copyEntity as Task);
				references.push(taskBoardElement);
			} else if (element.boardElementType === BoardElementType.Lesson) {
				const originalLesson = element.target as Lesson;
				// eslint-disable-next-line no-await-in-loop
				const status = await this.lessonCopyService.copyLesson({
					originalLesson,
					user: params.user,
					destinationCourse: params.destinationCourse,
				});
				elements.push(status);
				const lessonBardElement = BoardElement.FromLesson(status.copyEntity as Lesson);
				references.push(lessonBardElement);
			}
		}

		const copy = new Board({ references, course: params.destinationCourse });
		const status = {
			title: 'board',
			type: CopyElementType.BOARD,
			status: this.copyHelperService.deriveStatusFromElements(elements),
			copyEntity: copy,
			elements,
		};

		return status;
	}
}
