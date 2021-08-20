import { Injectable, UnauthorizedException } from '@nestjs/common';
import { EntityId, IPagination, Counted, ICurrentUser } from '@shared/domain';

import { LearnroomFacade } from '../../learnroom';

import { TaskRepo, SubmissionRepo } from '../repo';
import { TaskDomainService, TaskWithSubmissionStatus } from '../domain';

@Injectable()
export class TaskUC {
	// It should remove later
	permissions = {
		teacherDashboard: 'TASK_DASHBOARD_TEACHER_VIEW_V3',
		studentDashboard: 'TASK_DASHBOARD_VIEW_V3',
	};

	// TODO: IMPORTANT steps for this PULL REQUEST
	// delete all learnroom stuff, move repo of course and coursegroups to a new top level repo layer
	// do the same for course and coursgroup entity
	// delete coursegroup info entity and replace it with final entity
	// remove coursegroup entity from repo and pass it from uc
	// move submissions and task with repos to new area
	// cleanup and refactor task and submissions entitys > props and methodes
	// write tests for uc
	// -------------optional----------
	// add short cut imports for entitys and for repos
	// think about if status can move to task entity, than we can move logic also to it.
	// ------------------
	// next steps remove lesson info and replace with lesson
	// add lesson repo to this uc and pass data over uc
	constructor(
		private readonly taskRepo: TaskRepo,
		private readonly submissionRepo: SubmissionRepo,
		private readonly learnroomFacade: LearnroomFacade
	) {}

	async findAllOpenForStudent(userId: EntityId, pagination: IPagination): Promise<Counted<TaskWithSubmissionStatus[]>> {
		// Important the facade strategy is only a temporary solution until we established a better way for resolving the dependency graph
		const [courses] = await this.learnroomFacade.findCoursesWithGroupsByUserId(userId);

		const [submissionsOfStudent] = await this.submissionRepo.findByUserId(userId);
		const taskIdsThatHaveSubmissions = submissionsOfStudent.map((submission) => submission.task.id);

		const courseIds = courses.map((course) => course.id);

		const [tasks, total] = await this.taskRepo.findAllByStudent(courseIds, pagination, taskIdsThatHaveSubmissions);

		const domain = new TaskDomainService(tasks, courses);
		// after add status to task it is not nessasray to return it directly
		// we can do the step and in the end use prepareTasks.getResult();
		const computedTasks = domain.computeStatusForStudents(submissionsOfStudent);

		return [computedTasks, total];
	}

	async findAllOpenByTeacher(userId: EntityId, pagination: IPagination): Promise<Counted<TaskWithSubmissionStatus[]>> {
		// Important the facade stategue is only a temporary solution until we established a better way for resolving the dependency graph
		const [courses] = await this.learnroomFacade.findCoursesWithGroupsByUserId(userId);

		// !!! Add Authorization service or logic until it is avaible !!!
		const coursesWithWritePermissions = courses.filter((c) => c.hasWritePermission(userId));

		const courseIds = coursesWithWritePermissions.map((course) => course.id);

		const [tasks, total] = await this.taskRepo.findAllAssignedByTeacher(courseIds, pagination);
		const [submissionsOfTeacher] = await this.submissionRepo.findByTasks(tasks);

		const domain = new TaskDomainService(tasks, coursesWithWritePermissions);
		// after add status to task it is not nessasray to return it directly
		// we can do the step and in the end use prepareTasks.getResult();
		const computedTasks = domain.computeStatusForTeachers(submissionsOfTeacher);

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
