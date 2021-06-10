import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain';
import { QueryOrder } from '@mikro-orm/core';
import { PaginationModel } from '@shared/repo';
import { Counted } from '@shared/types';
import { Task, Submission, Course, Lesson } from '../entity';

@Injectable()
export class TaskRepo {
	constructor(private readonly em: EntityManager) {}

	// WARNING: this is used to deal with the current datamodel, and needs to be changed.
	// DO NOT DO THIS AT HOME!!
	async findAllOpenByStudent(userId: EntityId, { limit, skip }: PaginationModel = {}): Promise<Counted<Task[]>> {
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

		const oneWeekAgo = new Date();
		oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
		const [usersTasks, total] = await this.em.findAndCount(
			Task,
			{
				// TODO task query builder, see NewsScope
				$and: [
					{ id: { $nin: homeworksWithSubmissions } },
					{ private: { $ne: true } },
					{ course: { $in: coursesOfStudent } },
					{ $or: [{ lesson: null }, { lesson: { $in: lessonsOfStudent } }] },
					{ $or: [{ dueDate: { $gte: oneWeekAgo } }, { dueDate: null }] },
				],
			},
			{ populate: ['course'], limit, offset: skip, orderBy: { dueDate: QueryOrder.ASC } }
		);

		return [usersTasks, total];
	}
}
