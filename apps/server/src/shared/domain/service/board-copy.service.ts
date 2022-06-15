import { Injectable } from '@nestjs/common';
import { Board, BoardElement, BoardElementType, Course, Lesson, Task, User } from '../entity';
import { CopyElementType, CopyStatus, CopyStatusEnum } from '../types';
import { LessonCopyService } from './lesson-copy.service';
import { TaskCopyService } from './task-copy.service';

export type BoardCopyParams = {
	originalBoard: Board;
	destinationCourse: Course;
	user: User;
};

export type BoardCopyResponse = {
	copy: Board;
	status: CopyStatus;
};

@Injectable()
export class BoardCopyService {
	constructor(
		private readonly taskCopyService: TaskCopyService,
		private readonly lessonCopyService: LessonCopyService
	) {}

	copyBoard(params: BoardCopyParams): BoardCopyResponse {
		const elementStatuses: CopyStatus[] = [];
		const references: BoardElement[] = [];

		params.originalBoard.getElements().forEach((element) => {
			if (element.boardElementType === BoardElementType.Task) {
				const originalTask = element.target as Task;
				const { status } = this.taskCopyService.copyTaskMetadata({
					originalTask,
					user: params.user,
					destinationCourse: params.destinationCourse,
				});
				elementStatuses.push(status);
				const taskBoardElement = BoardElement.FromTask(status.copyEntity as Task);
				references.push(taskBoardElement);
			}
			if (element.boardElementType === BoardElementType.Lesson) {
				const originalLesson = element.target as Lesson;
				const { status } = this.lessonCopyService.copyLesson({
					originalLesson,
					user: params.user,
					destinationCourse: params.destinationCourse,
				});
				elementStatuses.push(status);
			}
		});

		const result = {
			copy: new Board({ references, course: params.destinationCourse }),
			status: {
				title: 'board',
				type: CopyElementType.BOARD,
				status: CopyStatusEnum.FAIL,
				elements: elementStatuses,
			},
		};

		return result;
	}
}
