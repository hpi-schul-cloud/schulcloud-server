import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { EntityId, IPagination } from '@shared/domain';
import { QueryOrder } from '@mikro-orm/core';
import { Counted } from '@shared/domain/types';
import { Task } from '../entity';

/*
const homeworkSchema = new Schema({
	schoolId: { type: Schema.Types.ObjectId, required: true },
	createdAt: { type: Date, default: Date.now },
	fileIds: [{ type: Schema.Types.ObjectId, ref: 'file' }],
	updatedAt: { type: Date, default: Date.now },
	name: { type: String, required: true },
	description: { type: String },
	dueDate: { type: Date },
	availableDate: { type: Date, required: true },
	teacherId: { type: Schema.Types.ObjectId, required: true, ref: 'user' },
	courseId: {
		type: Schema.Types.ObjectId,
		default: null,
		ref: 'course',
	},
	lessonId: { type: Schema.Types.ObjectId, default: null, ref: 'lesson' },
	private: { type: Boolean },
	publicSubmissions: { type: Boolean },
	teamSubmissions: { type: Boolean },
	maxTeamMembers: { type: Number, default: null, min: 1 },
	archived: [{ type: Schema.Types.ObjectId, ref: 'user' }],
});

const submissionSchema = new Schema({
	schoolId: { type: Schema.Types.ObjectId, required: true },
	createdAt: { type: Date, default: Date.now },
	updatedAt: { type: Date, default: Date.now },
	comment: { type: String },
	grade: { type: Number, min: 0, max: 100 },
	gradeComment: { type: String },
	homeworkId: {
		type: Schema.Types.ObjectId,
		required: true,
		ref: 'homework',
	},
	studentId: { type: Schema.Types.ObjectId, required: true, ref: 'user' },
	teamMembers: [{ type: Schema.Types.ObjectId, required: true, ref: 'user' }],
	courseGroupId: { type: Schema.Types.ObjectId, ref: 'courseGroup' },
	fileIds: [{ type: Schema.Types.ObjectId, ref: 'file' }],
	gradeFileIds: [{ type: Schema.Types.ObjectId, ref: 'file' }],
});

*/

export class FilterOptions {
	limit?: number;

	skip?: number;

	dueDateGreaterThen: Date;

	schoolId: EntityId;

	constructor(pagination: IPagination, dueDateGreaterThen: Date, schoolId: EntityId) {
		this.dueDateGreaterThen = dueDateGreaterThen;
		this.skip = pagination.skip;
		this.limit = pagination.limit;
		this.schoolId = schoolId;
	}
}

// TODO: add schoolId as filter vs shd operations?
@Injectable()
export class TaskRepo {
	constructor(private readonly em: EntityManager) {}

	async getOpenTaskByCourseListAndLessonList(
		lessonIdsAndCourseIds: EntityId[],
		filterOptions: FilterOptions
	): Promise<Counted<Task[]>> {
		const { limit, skip, dueDateGreaterThen, schoolId } = filterOptions;
		const [usersTasks, total] = await this.em.findAndCount(
			Task,
			{
				$and: [
					{ private: { $ne: true } },
					{ courseId: { $in: lessonIdsAndCourseIds } },
					{ schoolId },
					// Is lesson really needed ?? I think every lesson should select by a course
					{ $or: [{ lesson: null }, { lesson: { $in: lessonIdsAndCourseIds } }] },
					// WTF courseGroupId do not exist in task ...
					// { $or: [{ courseGroupId: null }, { courseGroupId: { $in: ressourceIds } }] },
					{ $or: [{ dueDate: { $gte: dueDateGreaterThen } }, { dueDate: null }] },
				],
			},
			{ limit, offset: skip, orderBy: { dueDate: QueryOrder.ASC } }
		);

		return [usersTasks, total];
	}
}
