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

@Injectable()
export class BoardCopyService {
	constructor(
		private readonly taskCopyService: TaskCopyService,
		private readonly lessonCopyService: LessonCopyService
	) {}

	copyBoard(params: BoardCopyParams): CopyStatus {
		const elements: CopyStatus[] = [];
		const references: BoardElement[] = [];

		params.originalBoard.getElements().forEach((element) => {
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
			}
			if (element.boardElementType === BoardElementType.Lesson) {
				const originalLesson = element.target as Lesson;
				const status = this.lessonCopyService.copyLesson({
					originalLesson,
					user: params.user,
					destinationCourse: params.destinationCourse,
				});
				elements.push(status);
				const lessonBardElement = BoardElement.FromLesson(status.copyEntity as Lesson);
				references.push(lessonBardElement);
			}
		});

		const copy = new Board({ references, course: params.destinationCourse });
		const status = {
			title: 'board',
			type: CopyElementType.BOARD,
			status: this.inferStatusFromElements(elements),
			copyEntity: copy,
			elements,
		};

		return status;
	}

	private inferStatusFromElements(elements: CopyStatus[]): CopyStatusEnum {
		const elementsStatuses = elements.map((el) => el.status);
		if (elementsStatuses.every((status) => status !== CopyStatusEnum.SUCCESS)) {
			return CopyStatusEnum.FAIL;
		}
		if (elementsStatuses.some((status) => status !== CopyStatusEnum.SUCCESS)) {
			return CopyStatusEnum.PARTIAL;
		}
		return CopyStatusEnum.SUCCESS;
	}
}
