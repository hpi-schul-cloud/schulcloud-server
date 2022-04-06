import { FilterQuery, QueryOrderMap } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { Counted, EntityId, IFindOptions, SortOrder, Task } from '@shared/domain';
import { BaseRepo } from '../base.repo';
import { TaskScope } from './task-scope';

@Injectable()
export class TaskRepo extends BaseRepo<Task> {
	get entityName() {
		return Task;
	}

	async findById(id: EntityId): Promise<Task> {
		const task = await super.findById(id);
		await this._em.populate(task, ['course', 'lesson', 'submissions']);
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
		options?: IFindOptions<Task>
	): Promise<Counted<Task[]>> {
		const { pagination } = options || {};

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

		// The dueDate can be similar to solve pagination request missmatches we must sort it over id too.
		// Because after executing limit() in mongoDB it is resort by similar dueDates.
		// It exist indexes for dueDate and for _id but no combined index, because it is to expensive for only small performance boost.
		const order = { dueDate: SortOrder.desc, id: SortOrder.asc };

		const [tasks, count] = await this._em.findAndCount(Task, scope.query, {
			offset: pagination?.skip,
			limit: pagination?.limit,
			orderBy: order,
		});

		await this._em.populate(tasks, ['course', 'lesson', 'submissions']);

		return [tasks, count];
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
		filters?: { draft?: boolean; noFutureAvailableDate?: boolean },
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

		const countedTaskList = await this.findTasksAndCount(scope.query, options);

		return countedTaskList;
	}

	private async findTasksAndCount(query: FilterQuery<Task>, options?: IFindOptions<Task>): Promise<Counted<Task[]>> {
		const { pagination, order } = options || {};
		const [taskEntities, count] = await this._em.findAndCount(Task, query, {
			offset: pagination?.skip,
			limit: pagination?.limit,
			orderBy: order as QueryOrderMap<Task>,
		});

		await this._em.populate(taskEntities, ['course', 'lesson', 'submissions']);

		return [taskEntities, count];
	}
}
