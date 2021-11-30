import { Injectable } from '@nestjs/common';
import { FilterQuery, QueryOrderMap } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mongodb';

import { EntityId, IFindOptions, Task, Counted, SortOrder } from '@shared/domain';

import { TaskScope } from './task-scope';

@Injectable()
export class TaskRepo {
	constructor(private readonly em: EntityManager) {}

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
		closedForOpenCoursesAndLessons.byClosed(parentIds.creatorId, true);

		const allForFinishedCoursesAndLessons = new TaskScope();
		allForFinishedCoursesAndLessons.addQuery(parentsFinished.query);
		allForFinishedCoursesAndLessons.byDraft(false);

		// must find also closed without course or lesson as parent
		const closedForCreator = new TaskScope();
		closedForCreator.byClosed(parentIds.creatorId, true);
		closedForCreator.byCreatorId(parentIds.creatorId);

		const allForFinishedCoursesAndLessonsForCreator = new TaskScope();
		allForFinishedCoursesAndLessonsForCreator.addQuery(parentsFinished.query);
		allForFinishedCoursesAndLessonsForCreator.byCreatorId(parentIds.creatorId);

		const allForCreator = new TaskScope('$or');
		allForCreator.addQuery(closedForCreator.query);
		allForCreator.addQuery(allForFinishedCoursesAndLessonsForCreator.query);

		scope.addQuery(closedForOpenCoursesAndLessons.query);
		scope.addQuery(allForFinishedCoursesAndLessons.query);
		scope.addQuery(allForCreator.query);

		const order = { dueDate: SortOrder.desc };

		const [tasks, count] = await this.em.findAndCount(Task, scope.query, {
			offset: pagination?.skip,
			limit: pagination?.limit,
			orderBy: order,
		});

		await this.em.populate(tasks, ['course', 'lesson', 'submissions']);

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
		filters?: { draft?: boolean; afterDueDateOrNone?: Date; closed?: { userId: EntityId; value: boolean } },
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

		if (filters?.closed) {
			scope.byClosed(filters.closed.userId, filters.closed.value);
		}

		if (filters?.draft !== undefined) {
			scope.byDraft(filters.draft);
		}

		if (filters?.afterDueDateOrNone !== undefined) {
			scope.afterDueDateOrNone(filters.afterDueDateOrNone);
		}

		const countedTaskList = await this.findTasksAndCount(scope.query, options);

		return countedTaskList;
	}

	private async findTasksAndCount(query: FilterQuery<Task>, options?: IFindOptions<Task>): Promise<Counted<Task[]>> {
		const { pagination, order } = options || {};
		const [taskEntities, count] = await this.em.findAndCount(Task, query, {
			offset: pagination?.skip,
			limit: pagination?.limit,
			orderBy: order as QueryOrderMap,
		});

		await this.em.populate(taskEntities, ['course', 'lesson', 'submissions']);

		return [taskEntities, count];
	}
}
