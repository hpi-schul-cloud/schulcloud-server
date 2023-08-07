import { FilterQuery } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { Task } from '@shared/domain/entity';
import { IFindOptions, SortOrder } from '@shared/domain/interface';
import { Counted, EntityId } from '@shared/domain/types';
import { BaseRepo } from '../base.repo';
import { TaskScope } from './task-scope';

@Injectable()
export class TaskRepo extends BaseRepo<Task> {
	get entityName() {
		return Task;
	}

	private async populate(tasks: Task[]): Promise<void> {
		await this._em.populate(tasks, [
			'course',
			'lesson',
			'lesson.course',
			'lesson.courseGroup',
			'submissions',
			'submissions.courseGroup',
		]);
	}

	async createTask(task: Task): Promise<void> {
		return this.save(this.create(task));
	}

	async findById(id: EntityId): Promise<Task> {
		const task = await super.findById(id);

		await this.populate([task]);

		return task;
	}

	async findAllFinishedByParentIds(
		parentIds: {
			creatorId: EntityId;
			openCourseIds: EntityId[];
			lessonIdsOfOpenCourses: EntityId[];
			finishedCourseIds: EntityId[];
			lessonIdsOfFinishedCourses: EntityId[];
		},
		filters?: {
			userId?: EntityId;
		},
		options?: IFindOptions<Task>
	): Promise<Counted<Task[]>> {
		const scope = new TaskScope('$or');

		const parentsOpen = new TaskScope('$or');
		parentsOpen.byCourseIds(parentIds.openCourseIds);
		parentsOpen.byLessonIds(parentIds.lessonIdsOfOpenCourses);

		const parentsFinished = new TaskScope('$or');
		parentsFinished.byCourseIds(parentIds.finishedCourseIds);
		parentsFinished.byLessonIds(parentIds.lessonIdsOfFinishedCourses);

		const closedForOpenCoursesAndLessons = new TaskScope();
		closedForOpenCoursesAndLessons.addQuery(parentsOpen.query);
		closedForOpenCoursesAndLessons.byDraft(false);
		closedForOpenCoursesAndLessons.byFinished(parentIds.creatorId, true);

		const allForFinishedCoursesAndLessons = new TaskScope();
		allForFinishedCoursesAndLessons.addQuery(parentsFinished.query);
		allForFinishedCoursesAndLessons.byDraft(false);

		// must find also closed without course or lesson as parent
		const closedWithoutParentForCreator = new TaskScope();
		closedWithoutParentForCreator.byFinished(parentIds.creatorId, true);
		closedWithoutParentForCreator.byOnlyCreatorId(parentIds.creatorId);

		const closedDraftsForCreator = new TaskScope();
		closedDraftsForCreator.addQuery(parentsOpen.query);
		closedDraftsForCreator.byFinished(parentIds.creatorId, true);
		closedDraftsForCreator.byCreatorId(parentIds.creatorId);

		const allForFinishedCoursesAndLessonsForCreator = new TaskScope();
		allForFinishedCoursesAndLessonsForCreator.addQuery(parentsFinished.query);
		allForFinishedCoursesAndLessonsForCreator.byCreatorId(parentIds.creatorId);

		const allForCreator = new TaskScope('$or');
		allForCreator.addQuery(closedWithoutParentForCreator.query);
		allForCreator.addQuery(closedDraftsForCreator.query);
		allForCreator.addQuery(allForFinishedCoursesAndLessonsForCreator.query);

		scope.addQuery(closedForOpenCoursesAndLessons.query);
		scope.addQuery(allForFinishedCoursesAndLessons.query);
		scope.addQuery(allForCreator.query);

		let { query } = scope;

		if (filters?.userId) {
			const forAssignedUser = new TaskScope();
			forAssignedUser.byAssignedUser(filters.userId);

			const filtersScope = new TaskScope('$and');
			filtersScope.addQuery(forAssignedUser.query);
			filtersScope.addQuery(scope.query);

			({ query } = filtersScope);
		}

		const countedTaskList = await this.findTasksAndCount(query, options);

		return countedTaskList;
	}

	/**
	 * Find all tasks by their parents which can be any of
	 * - a teacher who owns the task
	 * - a list of courses
	 * - a list of lessons
	 *
	 * @param parentIds parentIds for teacher, courses and lesson
	 * @param filters filters
	 * @param options pagination, sorting
	 * @returns
	 */
	async findAllByParentIds(
		parentIds: {
			creatorId?: EntityId;
			courseIds?: EntityId[];
			lessonIds?: EntityId[];
		},
		filters?: {
			afterDueDateOrNone?: Date;
			finished?: { userId: EntityId; value: boolean };
			availableOn?: Date;
			userId?: EntityId;
		},
		options?: IFindOptions<Task>
	): Promise<Counted<Task[]>> {
		const scope = new TaskScope();

		const parentIdScope = new TaskScope('$or');

		if (parentIds.creatorId) {
			parentIdScope.byOnlyCreatorId(parentIds.creatorId);
		}

		if (parentIds.courseIds) {
			parentIdScope.byCourseIds(parentIds.courseIds);
		}

		if (parentIds.lessonIds) {
			parentIdScope.byLessonIds(parentIds.lessonIds);
		}

		scope.addQuery(parentIdScope.query);

		if (filters?.userId) {
			scope.byAssignedUser(filters.userId);
		}

		if (filters?.finished) {
			scope.byFinished(filters.finished.userId, filters.finished.value);
		}

		if (parentIds.creatorId) {
			scope.excludeDraftsOfOthers(parentIds.creatorId);
		} else {
			scope.byDraft(false);
		}

		if (filters?.afterDueDateOrNone !== undefined) {
			scope.afterDueDateOrNone(filters.afterDueDateOrNone);
		}

		if (filters?.availableOn !== undefined) {
			if (parentIds.creatorId) {
				scope.excludeUnavailableOfOthers(parentIds.creatorId, filters.availableOn);
			} else {
				scope.byAvailable(filters?.availableOn);
			}
		}

		const countedTaskList = await this.findTasksAndCount(scope.query, options);

		return countedTaskList;
	}

	async findBySingleParent(
		creatorId: EntityId,
		courseId: EntityId,
		filters?: { draft?: boolean; noFutureAvailableDate?: boolean; userId?: EntityId },
		options?: IFindOptions<Task>
	): Promise<Counted<Task[]>> {
		const scope = new TaskScope();
		scope.byCourseIds([courseId]);

		if (filters?.draft !== undefined) {
			if (filters?.draft === true) {
				scope.excludeDraftsOfOthers(creatorId);
			} else {
				scope.byDraft(false);
			}
		}

		if (filters?.noFutureAvailableDate !== undefined) {
			scope.noFutureAvailableDate();
		}

		if (filters?.userId) {
			scope.byAssignedUser(filters.userId);
		}

		const countedTaskList = await this.findTasksAndCount(scope.query, options);

		return countedTaskList;
	}

	private async findTasksAndCount(query: FilterQuery<Task>, options?: IFindOptions<Task>): Promise<Counted<Task[]>> {
		const pagination = options?.pagination || {};
		const order = options?.order || {};

		// In order to solve pagination missmatches we apply a default order by _id. This is necessary
		// because other fields like the dueDate can be equal or null.
		// When pagination is used, sorting takes place on every page and if ambiguous leads to unwanted results.
		// Note: Indexes for dueDate and for _id do exist but there's no combined index.
		// This is okay, because the combined index would be too expensive for the particular purpose here.
		if (order._id == null) {
			order._id = SortOrder.asc;
		}

		const [tasks, count] = await this._em.findAndCount(Task, query, {
			offset: pagination?.skip,
			limit: pagination?.limit,
			orderBy: order,
		});

		await this.populate(tasks);

		return [tasks, count];
	}
}
