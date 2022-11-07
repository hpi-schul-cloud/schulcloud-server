import { Injectable } from '@nestjs/common';
import { Course, Lesson, Task, User } from '@shared/domain/entity';
import { CopyElementType, CopyStatus, CopyStatusEnum } from '@shared/domain/types';
import { CopyHelperService } from './copy-helper.service';

export type TaskCopyParams = {
	originalTask: Task;
	destinationCourse?: Course;
	destinationLesson?: Lesson;
	user: User;
	copyName?: string;
};

@Injectable()
export class TaskCopyService {
	constructor(private readonly copyHelperService: CopyHelperService) {}

	copyTaskMetadata(params: TaskCopyParams): CopyStatus {
		const copy = new Task({
			name: params.copyName || params.originalTask.name,
			description: params.originalTask.description,
			school: params.user.school,
			creator: params.user,
			course: params.destinationCourse,
			lesson: params.destinationLesson,
		});

		const elements = [...this.defaultTaskStatusElements()];

		const status: CopyStatus = {
			title: copy.name,
			type: CopyElementType.TASK,
			status: this.copyHelperService.deriveStatusFromElements(elements),
			copyEntity: copy,
			originalEntity: params.originalTask,
			elements,
		};

		return status;
	}

	private defaultTaskStatusElements(): CopyStatus[] {
		return [
			{
				type: CopyElementType.METADATA,
				status: CopyStatusEnum.SUCCESS,
			},
			{
				type: CopyElementType.CONTENT,
				status: CopyStatusEnum.SUCCESS,
			},
			{
				type: CopyElementType.SUBMISSION_GROUP,
				status: CopyStatusEnum.NOT_DOING,
			},
		];
	}
}
