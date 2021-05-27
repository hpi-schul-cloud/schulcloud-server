import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain';
import { ITaskOption, Task, ITaskMetadata, Submission, Course, Lesson } from '../entity';

@Injectable()
export class TaskRepo {
	constructor(private readonly em: EntityManager) {}

	// WARNING: this is used to deal with the current datamodel, and needs to be changed.
	// DO NOT DO THIS AT HOME!!
	async findAllOpenByStudent(userId: EntityId, { year, limit, skip }: ITaskOption = {}): Promise<ITaskMetadata[]> {
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

		const usersTasks = await this.em.find(
			Task,
			{
				$and: [
					{ id: { $nin: homeworksWithSubmissions } },
					{ private: { $ne: true } },
					{ course: { $in: coursesOfStudent } },
					{ $or: [{ lesson: null }, { lesson: { $in: lessonsOfStudent } }] },
				],
			},
			['course']
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
			} as ITaskMetadata; // TODO does not match ITaskMetadata, remove as...
		});

		// TODO: pagination or total is missing
		return mappedTasks;
	}
}
