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

		const elements = [...this.defaultTaskStatusElements(), ...this.copyTaskFiles(params.originalTask)];

		const status: CopyStatus = {
			title: copy.name,
			type: CopyElementType.TASK,
			destinationCourseId: params.destinationCourse?.id,
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

	private copyTaskFiles(task: Task): CopyStatus[] {
		const fileNames = task.getFileNames();
		if (fileNames.length > 0) {
			const elements = fileNames.map((title) => ({
				title,
				type: CopyElementType.FILE,
				status: CopyStatusEnum.NOT_IMPLEMENTED,
			}));
			const fileStatus = {
				type: CopyElementType.FILE_GROUP,
				status: CopyStatusEnum.NOT_IMPLEMENTED,
				elements,
			};
			return [fileStatus];
		}
		return [];
	}
}
