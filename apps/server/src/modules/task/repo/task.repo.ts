import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { EntityId, Task, ITaskMetadata, Submission, Course, Lesson } from '../entity';
import { PaginationModel } from '../../../shared/core/repo/index';
import { QueryOrder } from '@mikro-orm/core';
import { Paginated } from '../../../shared/core/types/paginated';

@Injectable()
export class TaskRepo {
	constructor(private readonly em: EntityManager) {}

	// WARNING: this is used to deal with the current datamodel, and needs to be changed.
	// DO NOT DO THIS AT HOME!!
	async findAllOpenByStudent(
		userId: EntityId,
		{ limit, skip }: PaginationModel = {}
	): Promise<Paginated<ITaskMetadata[]>> {
		// todo: handle coursegroups
		const coursesOfStudent = await this.em.find(Course, {
			students: userId,
		});
		const lessonsOfStudent = await this.em.find(Lesson, {
			course: { $in: coursesOfStudent },
			hidden: false,
		});

		const submissionsOfStudent = await this.em.find(Submission, {
			student: userId,
		});
		const homeworksWithSubmissions = submissionsOfStudent.map((submission) => submission.homework.id);

		const [usersTasks, total] = await this.em.findAndCount(
			Task,
			{
				$and: [
					{ id: { $nin: homeworksWithSubmissions } },
					{ private: { $ne: true } },
					{ course: { $in: coursesOfStudent } },
					{ $or: [{ lesson: null }, { lesson: { $in: lessonsOfStudent } }] },
				],
			},
			{ populate: ['course'], limit, offset: skip, orderBy: { dueDate: QueryOrder.ASC } }
		);

		const mappedTasks = usersTasks.map((task) => {
			return {
				id: task.id,
				_id: task._id,
				name: task.name,
				duedate: task.dueDate,
				courseName: task.course?.name,
				displayColor: task.course?.color,
				createdAt: task.createdAt,
				updatedAt: task.updatedAt,
			};
		});

		// TODO: pagination or total is missing
		return {
			data: mappedTasks,
			total,
			limit,
			skip,
		};
	}
}
