import { Injectable } from '@nestjs/common';
import { FilterQuery, QueryOrderMap } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mongodb';

import { EntityId, IFindOptions, Task, Counted, SortOrder } from '@shared/domain';

import { TaskScope } from './task-scope';
/*
interface IAggregation<T> {
	$match?: FilterQuery<T>;
	$lookup?: {
		from: string;
		localField: string;
		foreignField: string;
		as: string;
	};
	$sort?: Record<string, number>;
	$skip?: number;
	$limit?: number;
}
*/
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

		const parents = new TaskScope('$or');
		parents.byCourseIds(parentIds.openCourseIds);
		parents.byLessonIds(parentIds.lessonIdsOfOpenCourses);

		const openScope = new TaskScope();
		openScope.addQuery(parents.query);
		openScope.byClosed(parentIds.creatorId, true);

		const finishedScope = new TaskScope('$or');
		finishedScope.byCourseIds(parentIds.finishedCourseIds);
		finishedScope.byLessonIds(parentIds.lessonIdsOfFinishedCourses);

		const creatorScope = new TaskScope();
		creatorScope.byClosed(parentIds.creatorId, true);
		creatorScope.byCreatorId(parentIds.creatorId);

		scope.addQuery(openScope.query);
		scope.addQuery(finishedScope.query);
		scope.addQuery(creatorScope.query);

		const order = { dueDate: SortOrder.desc };

		const [tasks, count] = await this.em.findAndCount(Task, scope.query, {
			offset: pagination?.skip,
			limit: pagination?.limit,
			orderBy: order,
		});

		// bad that it is not pass directly to findAndCount but it throw an error
		await this.em.populate(tasks, ['course', 'lesson']);

		return [tasks, count];
	}
	/*
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

		// Important aggregration pass any[] and has NO mikro-orm or entity support
		// draft (private) tasks can only see by the creator and not by other teachers
		const query: IAggregation<Task>[] = [
			{
				$match: {
					$or: [
						// each that are visible for the user
						{ $and: [{ courseId: { $in: courseIds } }, { lessonId: null }] }, // find all added on course
						{ lessonId: { $in: lessonsIds } }, // only visible lessons passed
						{ $and: [{ teacherId: userId }, { courseId: null }, { lessonId: null }] }, // by creator
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
					$or: [
						// each of them that are finished
						{ archived: userId }, // is archived by user
						{ $and: [{ 'courses.0.untilDate': { $lt: now } }, { private: { $ne: true } }] }, // course is finished but no drafts
						{ $and: [{ 'courses.0.untilDate': { $lt: now } }, { teacherId: userId }] }, // course is finished and creator see his one (drafts also)
					],
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
	*/

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
