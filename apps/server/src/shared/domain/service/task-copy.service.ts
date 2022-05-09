import { Injectable } from '@nestjs/common';
import { Task, User, Course, Lesson } from '@shared/domain/entity';

export type TaskCopyParams = {
	originalTask: Task;
	destinationCourse: Course;
	destinationLesson?: Lesson;
	user: User;
};

export type TaskCopyResponse = {
	copy: Task;
	status: CopyStatusDTO;
};

export type CopyStatusDTO = {
	title: string;
	type: CopyElementType;
	status: CopyStatusEnum;
	elements?: CopyStatusDTO[];
};

export enum CopyElementType {
	'TASK' = 'task',
	'FILE' = 'file',
	'LEAF' = 'leaf',
}

export enum CopyStatusEnum {
	'SUCCESS' = 'success',
	'FAIL' = 'failure', // but tried
	'NOT_DOING' = 'not-doing', // for functional reasons
	'NOT_SUPPORTET' = 'not-supported', // might be implemented in the future
}

@Injectable()
export class TaskCopyService {
	copyTaskMetadata(params: TaskCopyParams): TaskCopyResponse {
		const copy = new Task({
			name: params.originalTask.name,
			description: params.originalTask.description,
			school: params.user.school,
			creator: params.user,
			course: params.destinationCourse,
		});
		const status = {
			title: copy.name,
			type: CopyElementType.TASK,
			status: CopyStatusEnum.SUCCESS,
			elements: [
				{
					title: 'description',
					type: CopyElementType.LEAF,
					status: CopyStatusEnum.SUCCESS,
				},
				{
					title: 'submissions',
					type: CopyElementType.LEAF,
					status: CopyStatusEnum.NOT_DOING,
				},
				{
					title: 'files',
					type: CopyElementType.LEAF,
					status: CopyStatusEnum.NOT_SUPPORTET,
				},
			],
		};
		return { copy, status };
	}
}
