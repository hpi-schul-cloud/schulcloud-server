import { Injectable } from '@nestjs/common';
import { FilterQuery, QueryOrderMap } from '@mikro-orm/core';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';

import { EntityId, IFindOptions, Task, Counted } from '@shared/domain';

import { TaskScope } from './task-scope';

@Injectable()
export class TaskRepo {
	constructor(private readonly em: EntityManager) {}

	async findAllFinishedByParentIds(
		parentIds: {
			userId: EntityId;
			courseIds: EntityId[];
			lessonIds: EntityId[];
		},
		options?: IFindOptions<Task>
	): Promise<Counted<Task[]>> {
		const { pagination } = options || {};

		const courseIds = parentIds.courseIds.map((id) => new ObjectId(id));
		const lessonsIds = parentIds.lessonIds.map((id) => new ObjectId(id));
		const userId = new ObjectId(parentIds.userId);
		const now = new Date();
		// TODO: type
		const query: unknown[] = [
			{
				$match: {
					$or: [
						{ $and: [{ courseId: { $in: courseIds } }, { lesson: null }] },
						{ lessonId: { $in: lessonsIds } },
						{ teacherId: userId }, // creator
					],
				},
			},
			{
				$lookup: {
					from: 'courses',
					localField: 'courseId',
					foreignField: '_id',
					as: 'courses',
				},
			},
			{
				$match: {
					$or: [{ archived: userId }, { 'courses.0.untilDate': { $lt: now } }],
				},
			},
			{ $sort: { dueDate: -1 } },
		];

		// $facet is also a option instant of skip, limit seperatly
		if (pagination?.skip) {
			query.push({ $skip: pagination.skip });
		}

		if (pagination?.limit) {
			query.push({ $limit: pagination.limit });
		}

		const result = await this.em.aggregate(Task, query);
		const tasks = result.map((entity) => this.em.create(Task, entity));

		return [tasks, tasks.length];
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
			parentIdScope.byTeacherId(parentIds.creatorId);
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
		const { pagination, order, select } = options || {};
		const [taskEntities, count] = await this.em.findAndCount(Task, query, {
			offset: pagination?.skip,
			limit: pagination?.limit,
			orderBy: order as QueryOrderMap,
			fields: select,
		});

		await this.em.populate(taskEntities, ['course', 'lesson', 'submissions']);

		return [taskEntities, count];
	}
}
