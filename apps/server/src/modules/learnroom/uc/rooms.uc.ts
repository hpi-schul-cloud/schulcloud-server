import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { EntityId, Course, Task, TaskWithStatusVo, User, Lesson, BoardElement, BoardElementType } from '@shared/domain';
import { CourseRepo, LessonRepo, TaskRepo, UserRepo } from '@shared/repo';
import { RoomsAuthorisationService } from './rooms.authorisation.service';

export interface RoomBoardDTO {
	roomId: string;
	displayColor: string;
	title: string;
	elements: RoomBoardElementDTO[];
}

export type RoomBoardElementDTO = {
	type: string;
	content: TaskWithStatusVo | Lesson;
};

@Injectable()
export class RoomsUc {
	constructor(
		private readonly courseRepo: CourseRepo,
		private readonly lessonRepo: LessonRepo,
		private readonly taskRepo: TaskRepo,
		private readonly userRepo: UserRepo,
		private readonly authorisationService: RoomsAuthorisationService
	) {}

	async getBoard(roomId: EntityId, userId: EntityId): Promise<RoomBoardDTO> {
		const user = await this.userRepo.findById(userId, true);

		const course = await this.courseRepo.findOne(roomId, userId);
		const isTeacher = this.isTeacher(user, course);
		const taskFilter = this.taskFilter(isTeacher);
		const lessonFilter = this.lessonFilter(isTeacher);
		const [tasks] = await this.taskRepo.findBySingleParent(user.id, course.id, taskFilter);
		const tasksWithStatusVos = this.addStatusToTasks(isTeacher, tasks, user);
		const [lessons] = await this.lessonRepo.findAllByCourseIds([course.id], lessonFilter);
		const boardElements = this.buildBoardElements(tasksWithStatusVos, lessons);

		const board = this.buildBoard(course, boardElements);
		return board;
	}

	private taskFilter(isTeacher: boolean): { draft?: boolean; noFutureAvailableDate?: boolean } {
		const filters: { draft?: boolean; noFutureAvailableDate?: boolean } = {};
		if (!isTeacher) {
			filters.draft = false;
			filters.noFutureAvailableDate = true;
			return filters;
		}
		filters.draft = true;
		return filters;
	}

	// TODO: move somewhere else
	private buildBoard(room: Course, boardElements: RoomBoardElementDTO[]): RoomBoardDTO {
		const roomMetadata = room.getMetadata();
		const board = {
			roomId: roomMetadata.id,
			displayColor: roomMetadata.displayColor,
			title: roomMetadata.title,
			elements: boardElements,
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

	private lessonFilter(isTeacher: boolean): { hidden?: boolean } {
		const filters: { hidden?: boolean } = {};
		if (!isTeacher) {
			filters.hidden = false;
		}
		return filters;
	}

	private buildBoardElements(tasks: TaskWithStatusVo[], lessons: Lesson[]): RoomBoardElementDTO[] {
		const boardTasks = tasks.map((task) => ({ type: 'task', content: task }));
		const boardLessons = lessons.map((lesson) => ({ type: 'lesson', content: lesson }));
		const result = [...boardTasks, ...boardLessons];
		result.sort();
		return result;
	}
}
