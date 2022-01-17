import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { EntityId, Course, Task, TaskWithStatusVo } from '@shared/domain';
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
	content: TaskWithStatusVo;
};

@Injectable()
export class RoomsUc {
	constructor(private readonly courseRepo: CourseRepo, private readonly taskRepo: TaskRepo) {}

	async getBoard(roomId: EntityId, userId: EntityId): Promise<Board> {
		const course = await this.courseRepo.findOne(roomId, userId);
		const isTeacher = this.isTeacher(userId, course);
		const taskFilter = this.taskFilter(isTeacher);
		const [tasks] = await this.taskRepo.findBySingleParent(course.id, taskFilter);
		const tasksWithStatusVos = this.addStatusToTasks(isTeacher, tasks, userId);

		const board = this.buildBoard(course, tasksWithStatusVos);
		return board;
	}

	private taskFilter(isTeacher: boolean): { draft?: boolean } {
		const shouldShowDrafts = isTeacher;
		return { draft: shouldShowDrafts };
	}

	// TODO: move somewhere else
	private buildBoard(room: Course, tasks: TaskWithStatusVo[]): Board {
		const roomMetadata = room.getMetadata();
		const board = {
			roomId: roomMetadata.id,
			displayColor: roomMetadata.displayColor,
			title: roomMetadata.title,
			elements: tasks.map((task) => ({ type: 'task', content: task })),
		};
		return board;
	}

	private isTeacher(userId: EntityId, course: Course): boolean {
		if (course.getStudentIds().includes(userId)) {
			return false;
		}
		if (course.getTeacherIds().includes(userId) || course.getSubstitutionTeacherIds().includes(userId) === true) {
			return true;
		}
		throw new NotFoundException();
	}

	private addStatusToTasks(isTeacher: boolean, tasks: Task[], userId: EntityId): TaskWithStatusVo[] {
		let tasksWithStatusVos: TaskWithStatusVo[];
		if (isTeacher) {
			tasksWithStatusVos = tasks.map((task) => {
				const status = task.createTeacherStatusForUser(userId);
				return new TaskWithStatusVo(task, status);
			});
		} else {
			tasksWithStatusVos = tasks.map((task) => {
				const status = task.createStudentStatusForUser(userId);
				return new TaskWithStatusVo(task, status);
			});
		}
		return tasksWithStatusVos;
	}
}
