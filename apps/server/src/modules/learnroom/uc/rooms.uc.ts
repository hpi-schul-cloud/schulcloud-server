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
		const [tasks] = await this.taskRepo.findAllByParentIds({ courseIds: [course.id] });
		const courseRole = this.getRoleInCourse(userId, course);
		const tasksWithStatusVos = this.addStatusToTasks(courseRole, tasks, userId);

		const board = this.buildBoard(course, tasksWithStatusVos);
		return board;
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

	private getRoleInCourse(userId: EntityId, course: Course): string {
		if (course.getStudentIds().includes(userId)) {
			return 'student';
		}
		if (course.getTeacherIds().includes(userId) || course.getSubstitutionTeacherIds().includes(userId) === true) {
			return 'teacher';
		}
		throw new NotFoundException();
	}

	private addStatusToTasks(role: string, tasks: Task[], userId: EntityId): TaskWithStatusVo[] {
		let tasksWithStatusVos: TaskWithStatusVo[];
		if (role === 'student') {
			tasksWithStatusVos = tasks.map((task) => {
				const status = task.createStudentStatusForUser(userId);
				return new TaskWithStatusVo(task, status);
			});
		} else if (role === 'teacher') {
			tasksWithStatusVos = tasks.map((task) => {
				const status = task.createTeacherStatusForUser(userId);
				return new TaskWithStatusVo(task, status);
			});
		} else {
			throw new UnauthorizedException();
		}
		return tasksWithStatusVos;
	}
}
