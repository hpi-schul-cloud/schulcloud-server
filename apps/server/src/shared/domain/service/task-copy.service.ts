import { Injectable } from '@nestjs/common';
import { Course, Task, User } from '@shared/domain/entity';
import { CopyElementType, CopyStatusDTO, CopyStatusEnum } from '@shared/domain/types';

export type TaskCopyParams = {
	originalTask: Task;
	destinationCourse: Course;
	// destinationLesson?: Lesson;
	user: User;
};

export type TaskCopyResponse = {
	copy: Task;
	status: CopyStatusDTO;
};

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
			status: CopyStatusEnum.PARTIAL,
			copyEntity: copy,
			elements: [
				{
					title: 'metadata',
					type: CopyElementType.LEAF,
					status: CopyStatusEnum.SUCCESS,
				},
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
					status: CopyStatusEnum.NOT_IMPLEMENTED,
				},
			],
		};
		return { copy, status };
	}
}
