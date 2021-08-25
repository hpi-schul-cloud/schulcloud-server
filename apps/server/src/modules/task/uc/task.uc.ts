import { Injectable, UnauthorizedException } from '@nestjs/common';
import { EntityId, IPagination, Counted, ICurrentUser, SortOrder } from '@shared/domain';
import { CourseRepo } from '@src/repositories';
import { Course } from '@src/entities';

import { TaskRepo, SubmissionRepo } from '../repo';
import { TaskDomainService, TaskWithSubmissionStatus } from '../domain';

enum Permission {
	read,
	write,
}

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
		private readonly courseRepo: CourseRepo
	) {}

	// coursegroups are missing
	// lessons are missing -> only search for hidden: false,
	private async findPermittedTaskParents(userId: EntityId, permission: Permission): Promise<Course[]> {
		const [allCourses] = await this.courseRepo.findAllByUserId(userId);

		// !!! Add Authorization service or logic until it is avaible !!!
		const parents = allCourses.filter((c) =>
			permission === Permission.write ? c.hasWritePermission(userId) : !c.hasWritePermission(userId)
		);

		return parents;
	}

	async findAllOpenForStudent(userId: EntityId, pagination: IPagination): Promise<Counted<TaskWithSubmissionStatus[]>> {
		const courses = await this.findPermittedTaskParents(userId, Permission.read);

		const [submissionsOfStudent] = await this.submissionRepo.findByUserId(userId);
		const taskIdsThatHaveSubmissions = submissionsOfStudent.map((submission) => submission.task.id);

		const parentIds = courses.map((course) => course.id);

		const [tasks, total] = await this.taskRepo.findAllCurrent(parentIds, taskIdsThatHaveSubmissions, {
			pagination,
			order: { dueDate: SortOrder.asc },
		});

		const domain = new TaskDomainService(tasks, courses);
		const computedTasks = domain.computeStatusForStudents(submissionsOfStudent);

		return [computedTasks, total];
	}

	// TODO: rename teacher and student
	async findAllOpenByTeacher(userId: EntityId, pagination: IPagination): Promise<Counted<TaskWithSubmissionStatus[]>> {
		const courses = await this.findPermittedTaskParents(userId, Permission.write);

		const parentIds = courses.map((course) => course.id);

		const [tasks, total] = await this.taskRepo.findAll(parentIds, { pagination, order: { createdAt: SortOrder.desc } });
		const [submissionsOfTeacher] = await this.submissionRepo.findByTasks(tasks);

		const domain = new TaskDomainService(tasks, courses);
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
