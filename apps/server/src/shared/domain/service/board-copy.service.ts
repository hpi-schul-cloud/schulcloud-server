import { Injectable } from '@nestjs/common';
import { Board, BoardElement, BoardElementType, Course, Task, User } from '../entity';
import { CopyElementType, CopyStatus, CopyStatusEnum } from '../types';
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
	constructor(private readonly taskCopyService: TaskCopyService) {}

	copyBoard(params: BoardCopyParams): BoardCopyResponse {
		const tasks = params.originalBoard
			.getElements()
			.filter((e) => e.boardElementType === BoardElementType.Task)
			.map((e) => e.target as Task);

		const taskElements = tasks.map((originalTask) => {
			const { copy } = this.taskCopyService.copyTaskMetadata({
				originalTask,
				user: params.user,
				destinationCourse: params.destinationCourse,
			});
			const taskBoardElement = BoardElement.FromTask(copy);
			return taskBoardElement;
		});

		const result = {
			copy: new Board({ references: [...taskElements], course: params.destinationCourse }),
			status: {
				title: 'board',
				type: CopyElementType.BOARD,
				status: CopyStatusEnum.FAIL,
			},
		};

		return result;
	}
}
