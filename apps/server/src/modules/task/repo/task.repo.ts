import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ITaskQuery, EntityId, ITask, Task, ISubmission, ILesson, ICourse } from '../entity';


@Injectable()
export class TaskRepo {
	constructor(
		@InjectModel('Task') private readonly taskModel: Model<ITask>,
		@InjectModel('Submission') private readonly submissionModel: Model<ISubmission>,
		@InjectModel('Course') private readonly courseModel: Model<ICourse>,
		@InjectModel('Lesson') private readonly lessonModel: Model<ILesson>
	) {}

	// WARNING: this is used to deal with the current datamodel, and needs to be changed.
	// DO NOT DO THIS AT HOME!!
	async findAllOpenByStudent(userId: EntityId, { year, pagination }: ITaskQuery): Promise<Task[]> {
		const coursesOfStudent = await this.courseModel.find({ userIds: userId }).select('_id').lean().exec();
		// todo: handle coursegroups
		const lessonsOfStudent = await this.lessonModel
			.find({ courseId: { $in: coursesOfStudent }, hidden: false })
			.select('_id')
			.lean()
			.exec();

		const submissionsOfStudent = await this.submissionModel
			.find({
				studentId: userId,
			})
			.select('homeworkId')
			.lean()
			.exec();
		const homeworksWithSubmissions = submissionsOfStudent.map((submission) => submission.homeworkId);

		const openTasksOfStudent = await this.taskModel
			.find({
				courseId: { $in: coursesOfStudent },
				$or: [{ lessonId: { $exists: false } }, { lessonId: null }, { lessonId: { $in: lessonsOfStudent } }],
				_id: { $nin: homeworksWithSubmissions },
			})
			.populate({
				path: 'courseId',
				select: 'name color',
			})
			.lean()
			.exec();
		
		const mappedTasks = openTasksOfStudent.map((task) => {
			const entity = {
				id: task._id.toString(),
				_id: task._id,
				name: task.name,
				duedate: task.dueDate,
				courseName: task.courseId.name,
				displayColor: task.courseId.color,
				createdAt: task.createdAt,
			}
			return entity
		});
		return Promise.resolve(mappedTasks);
	}
}
