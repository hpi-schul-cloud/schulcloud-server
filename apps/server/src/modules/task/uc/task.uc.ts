/* istanbul ignore file */
// TODO add tests to improve coverage

import { Injectable, UnauthorizedException } from '@nestjs/common';
// import { LearnroomFacade } from '@modules/learnroom';
import { EntityId, IPagination, Counted, ICurrentUser } from '@shared/domain';
import { TaskRepo, SubmissionRepo } from '../repo';
import { ISubmissionStatus, Task } from '../entity';
import { LearnroomFacade } from '../../learnroom';
import { TaskSubmissionMetadata } from '../domain/TaskSubmissionMetadata';

export type TaskWithSubmissionStatus = {
	task: Task;
	status: ISubmissionStatus;
};

@Injectable()
export class TaskUC {
	permissions = {
		teacherDashboard: 'TASK_DASHBOARD_TEACHER_VIEW_V3',
		studentDashboard: 'TASK_DASHBOARD_VIEW_V3',
	};

	constructor(
		private readonly taskRepo: TaskRepo,
		private readonly submissionRepo: SubmissionRepo,
		private readonly learnroomFacade: LearnroomFacade
	) {}

	async findAllOpenForStudent(userId: EntityId, pagination: IPagination): Promise<Counted<TaskWithSubmissionStatus[]>> {
		// Add Authorization service or logic until it is avaible for learnroom
		/**
		 * Important the facade stategue is only a temporary solution until we established a better way for resolving the dependency graph
		 */
		const [coursesWithGroups] = await this.learnroomFacade.findCoursesWithGroupsByUserId(userId);
		const courseIds = coursesWithGroups.map((course) => course.id);

		const [submissionsOfStudent] = await this.submissionRepo.getAllSubmissionsByUser(userId);
		const tasksWithSubmissions = submissionsOfStudent.map((submission) => submission.task.id);

		const [tasks, total] = await this.taskRepo.findAllByStudent(courseIds, pagination, tasksWithSubmissions);

		// need also work for coursegroups
		const metadata = new TaskSubmissionMetadata(submissionsOfStudent);
		const computedTasks = tasks.map((task) => metadata.addStatusToTask(task, 1));

		// add course color and course name
		return [computedTasks, total];
	}

	async findAllOpenByTeacher(userId: EntityId, pagination: IPagination): Promise<Counted<TaskWithSubmissionStatus[]>> {
		// Add Authorization service or logic until it is avaible for learnroom
		/**
		 * Important the facade stategue is only a temporary solution until we established a better way for resolving the dependency graph
		 */
		const [coursesWithGroups] = await this.learnroomFacade.findCoursesWithGroupsByUserId(userId);
		const courseIds = coursesWithGroups.map((course) => course.id);

		// procede only with course that has write permissions best first way add additional call to learnroom facade as temporary solution

		const getStudentNumberOfCourseByCourseId = (courseId: EntityId): number => {
			let studentNumber = 0;
			const findCourse = coursesWithGroups.find((course) => course.id === courseId);

			if (findCourse !== undefined) {
				studentNumber = findCourse.getStudentsNumber();
			}
			return studentNumber;
		};

		const [tasks, total] = await this.taskRepo.findAllAssignedByTeacher(courseIds, pagination);
		const [submissions] = await this.submissionRepo.getSubmissionsByTasksList(tasks);

		// need also work for coursegroups
		const metadata = new TaskSubmissionMetadata(submissions);
		const computedTasks = tasks.map((task) =>
			metadata.addStatusToTask(task, getStudentNumberOfCourseByCourseId(task.courseId))
		);

		// add course color and course name
		return [computedTasks, total];
	}

	// should remove in future permissions not needed
	// maybe add different endpoints and if student ask teacher endpoint they get nothing
	async findAllOpen(currentUser: ICurrentUser, pagination: IPagination): Promise<Counted<TaskWithSubmissionStatus[]>> {
		const {
			user: { id, permissions },
		} = currentUser;

		let response: Counted<TaskWithSubmissionStatus[]>;
		if (permissions.includes(this.permissions.teacherDashboard)) {
			response = await this.findAllOpenByTeacher(id, pagination);
		} else if (permissions.includes(this.permissions.studentDashboard)) {
			response = await this.findAllOpenForStudent(id, pagination);
		} else {
			throw new UnauthorizedException();
		}

		return response;
	}
}
