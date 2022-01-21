import { Injectable } from '@nestjs/common';
import { EntityId, Course, Task, TaskWithStatusVo, User } from '@shared/domain';
import { CourseRepo, TaskRepo, UserRepo } from '@shared/repo';

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
	constructor(
		private readonly courseRepo: CourseRepo,
		private readonly taskRepo: TaskRepo,
		private readonly userRepo: UserRepo
	) {}

	async getBoard(roomId: EntityId, userId: EntityId): Promise<Board> {
		const user = await this.userRepo.findById(userId, true);

		const course = await this.courseRepo.findOne(roomId, userId);
		const isTeacher = this.isTeacher(user, course);
		const taskFilter = this.taskFilter(isTeacher);
		const [tasks] = await this.taskRepo.findBySingleParent(course.id, taskFilter);
		const tasksWithStatusVos = this.addStatusToTasks(isTeacher, tasks, user);

		const board = this.buildBoard(course, tasksWithStatusVos);
		return board;
	}

	private taskFilter(isTeacher: boolean): { draft?: boolean } {
		const filters: { draft?: boolean } = {};
		if (!isTeacher) {
			filters.draft = false;
		}
		return filters;
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

	private isTeacher(user: User, course: Course): boolean {
		if (course.teachers.contains(user) || course.substitutionTeachers.contains(user)) {
			return true;
		}
		return false;
	}

	private addStatusToTasks(isTeacher: boolean, tasks: Task[], user: User): TaskWithStatusVo[] {
		let tasksWithStatusVos: TaskWithStatusVo[];
		if (isTeacher) {
			tasksWithStatusVos = tasks.map((task) => {
				const status = task.createTeacherStatusForUser(user);
				return new TaskWithStatusVo(task, status);
			});
		} else {
			tasksWithStatusVos = tasks.map((task) => {
				const status = task.createStudentStatusForUser(user);
				return new TaskWithStatusVo(task, status);
			});
		}
		return tasksWithStatusVos;
	}
}
