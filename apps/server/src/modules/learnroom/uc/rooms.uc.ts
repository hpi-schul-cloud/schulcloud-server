import { Injectable, UnauthorizedException } from '@nestjs/common';
import { EntityId, Course, TaskWithStatusVo } from '@shared/domain';
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
		let tasksWithStatusVos: TaskWithStatusVo[];
		const studentStatus = this.isStudentInCourse(userId, course);
		const teacherStatus = this.isTeacherInCourse(userId, course);
		if (studentStatus) {
			tasksWithStatusVos = tasks.map((task) => {
				const status = task.createStudentStatusForUser(userId);
				return new TaskWithStatusVo(task, status);
			});
		} else if (teacherStatus) {
			tasksWithStatusVos = tasks.map((task) => {
				const status = task.createTeacherStatusForUser(userId);
				return new TaskWithStatusVo(task, status);
			});
		} else {
			throw new UnauthorizedException();
		}

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

	private isStudentInCourse(userId: EntityId, course?: Course): boolean {
		const isParticipant = course?.getStudentIds().includes(userId) === true;
		return isParticipant;
	}

	private isTeacherInCourse(userId: EntityId, course?: Course): boolean {
		const isParticipant = course?.getTeacherIds().includes(userId) === true;
		return isParticipant;
	}
}
