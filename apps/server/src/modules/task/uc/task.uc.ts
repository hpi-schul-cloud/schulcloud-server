import { Injectable } from '@nestjs/common';
import { IPagination, ResolvedUser, Counted, EntityId, PermissionsTypes } from '@shared/domain';
import { UserFacade } from '../../user';
import { TaskRepo, SubmissionRepo, LessonRepo, FilterOptions } from '../repo';
import { TaskResponse } from '../controller/dto';
import { TaskHelper } from './taskHelper';

@Injectable()
export class TaskUC {
	constructor(
		private readonly taskRepo: TaskRepo,
		private readonly submissionRepo: SubmissionRepo,
		private readonly lessonRepo: LessonRepo,
		private readonly userFacade: UserFacade
	) {}

	// TODO: Combine student and teacher logic if it is possible in next iterations
	// TODO: Add for students in status -> student has finished, teacher has answered
	async findAllOpen(user: ResolvedUser, pagination: IPagination): Promise<Counted<TaskResponse[]>> {
		const { id: userId, schoolId } = user;

		const filteredCourseGroups = await this.userFacade.getCourseGroupsByUserId(userId);
		const courseIds = filteredCourseGroups['course-teachers'].getExistingParentIds();

		// !!!date is set for student and teacher now!!!
		const dueDateGreaterThen = TaskHelper.calculateDateFilterForOpenTask();

		const publishedLessonsIds = await this.lessonRepo.getPublishedLessonsIdsByCourseIds(courseIds);

		// TODO: !!!  If it is really needed that we passed publisedLessons? As OR? If couseId also set by lessons homeworks it should find it without passing !!!
		// To many parameter and schoolId need also passed... -.-
		// But the dateFilter is part of uc not of the repo method
		const ressourceIds = [...courseIds, ...publishedLessonsIds] as EntityId[];
		const filterOptions = new FilterOptions(pagination, dueDateGreaterThen, schoolId);
		const [tasks, counted] = await this.taskRepo.getOpenTaskByCourseListAndLessonList(ressourceIds, filterOptions);
		// TODO: !!! find submissions by task it is different between teacher and student !!!
		// group.permission hold write and read permission PermissionsTypes.Read / PermissionsTypes.Write
		// const groups = filteredCourseGroups.getGroupsByParentId(taskId);
		// helper > filter all that has no write permission AND userId is not in submission ==
		// read should only get his own, write should get all
		// both only want the newest by createdAt
		const [submissions] = await this.submissionRepo.getSubmissionsByTasksList(tasks);

		const computedTasks = TaskHelper.computedTasksBySubmissions(tasks, submissions, filteredCourseGroups);
		// !!! In this workflow course color and course name is not passed for now,
		// because we do not know anything about the course. !!!

		// TODO: Add substitution teacher flag
		return [computedTasks, counted];
	}
}
