/* istanbul ignore file */
// TODO add tests to improve coverage

import { Injectable, UnauthorizedException } from '@nestjs/common';
// import { LearnroomFacade } from '@modules/learnroom';
import { EntityId, IPagination, Counted, ICurrentUser } from '@shared/domain';

import { LearnroomFacade } from '../../learnroom';

import { TaskRepo, SubmissionRepo } from '../repo';
import { EntityCollection } from '../utils';
import { TaskPreparations, TaskWithSubmissionStatus } from '../domain/TaskPreparations';

@Injectable()
export class TaskUC {
	// It should remove later
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
		// Important the facade stategue is only a temporary solution until we established a better way for resolving the dependency graph
		const [coursesWithGroups] = await this.learnroomFacade.findCoursesWithGroupsByUserId(userId);
		const courseCollection = new EntityCollection(coursesWithGroups);

		const [submissionsOfStudent] = await this.submissionRepo.getAllSubmissionsByUser(userId);
		const taskIdsThatHaveSubmissions = submissionsOfStudent.map((submission) => submission.task.id);

		const [tasks, total] = await this.taskRepo.findAllByStudent(
			courseCollection.getIds(),
			pagination,
			taskIdsThatHaveSubmissions
		);

		const prepareTasks = new TaskPreparations(courseCollection, tasks);
		prepareTasks.addParentToTasks();
		const computedTasks = prepareTasks.computeStatusForStudents(submissionsOfStudent);

		return [computedTasks, total];
	}

	async findAllOpenByTeacher(userId: EntityId, pagination: IPagination): Promise<Counted<TaskWithSubmissionStatus[]>> {
		// Important the facade stategue is only a temporary solution until we established a better way for resolving the dependency graph
		const [coursesWithGroups] = await this.learnroomFacade.findCoursesWithGroupsByUserId(userId);

		// Add Authorization service or logic until it is avaible for learnroom
		const courseWithGroupsWithWritePermissions = coursesWithGroups.filter((course) =>
			course.hasWritePermission(userId)
		);
		const courseCollection = new EntityCollection(courseWithGroupsWithWritePermissions);

		const [tasks, total] = await this.taskRepo.findAllAssignedByTeacher(courseCollection.getIds(), pagination);
		const [submissionsOfTeacher] = await this.submissionRepo.getSubmissionsByTasksList(tasks);

		const prepareTasks = new TaskPreparations(courseCollection, tasks);
		prepareTasks.addParentToTasks();
		const computedTasks = prepareTasks.computeStatusForTeachers(submissionsOfTeacher);

		return [computedTasks, total];
	}

	// should remove in future, permissions are not needed
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
