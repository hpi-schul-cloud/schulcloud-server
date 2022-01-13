import { Injectable } from '@nestjs/common';
import { EntityId, Task, Course } from '@shared/domain';
import { CourseRepo, TaskRepo } from '@shared/repo';

// TODO: move this somewhere else
export interface Board {
	roomId: string;
	displayColor: string;
	title: string;
	elements: BoardElement[];
}

export type BoardElement = {
	// TODO: should become fullblown class
	type: string;
	content: Task;
};

@Injectable()
export class RoomsUc {
	constructor(private readonly courseRepo: CourseRepo, private readonly taskRepo: TaskRepo) {}

	async getBoard(roomId: EntityId, userId: EntityId): Promise<Board> {
		const course = await this.courseRepo.findOne(roomId, userId);
		const [tasks] = await this.taskRepo.findAllByParentIds({ courseIds: [course.id] });
		const board = this.buildBoard(course, tasks);
		return board;
	}

	// TODO: move somewhere else
	private buildBoard(room: Course, tasks: Task[]): Board {
		const roomMetadata = room.getMetadata();
		const board = {
			roomId: roomMetadata.id,
			displayColor: roomMetadata.displayColor,
			title: roomMetadata.title,
			elements: tasks.map((task) => ({ type: 'task', content: task })),
		};
		return board;
	}
}
