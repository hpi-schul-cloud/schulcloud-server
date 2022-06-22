import { Injectable } from '@nestjs/common';
import { Course, Task, User } from '@shared/domain/entity';
import { CopyElementType, CopyStatus, CopyStatusEnum } from '@shared/domain/types';

export type TaskCopyParams = {
	originalTask: Task;
	destinationCourse?: Course;
	// destinationLesson?: Lesson;
	user: User;
};

@Injectable()
export class TaskCopyService {
	copyTaskMetadata(params: TaskCopyParams): CopyStatus {
		const copy = new Task({
			name: params.originalTask.name,
			description: params.originalTask.description,
			school: params.user.school,
			creator: params.user,
			course: params.destinationCourse,
		});

		const elements = [...this.defaultTaskStatusElements(), ...this.copyTaskFiles(params.originalTask)];

		const status: CopyStatus = {
			title: copy.name,
			type: CopyElementType.TASK,
			status: this.inferStatusFromElements(elements),
			copyEntity: copy,
			elements,
		};

		return status;
	}

	private defaultTaskStatusElements(): CopyStatus[] {
		return [
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
		];
	}

	private copyTaskFiles(task: Task): CopyStatus[] {
		const fileNames = task.getFileNames();
		if (fileNames.length === 1) {
			return [
				{
					title: fileNames[0],
					type: CopyElementType.LEAF,
					status: CopyStatusEnum.NOT_IMPLEMENTED,
				},
			];
		}
		if (fileNames.length > 1) {
			const elements = fileNames.map((title) => ({
				title,
				type: CopyElementType.FILE,
				status: CopyStatusEnum.NOT_IMPLEMENTED,
			}));
			const fileStatus = {
				title: 'files',
				type: CopyElementType.LEAF,
				status: CopyStatusEnum.NOT_IMPLEMENTED,
				elements,
			};
			return [fileStatus];
		}
		return [];
	}

	private inferStatusFromElements(elements: CopyStatus[]): CopyStatusEnum {
		const childrenStatusArray = elements.map((el) => el.status);
		// if (childrenStatusArray.includes(CopyStatusEnum.FAIL)) return CopyStatusEnum.PARTIAL; <- unused case, commented for now due to lack of test coverage and no scenario
		if (childrenStatusArray.includes(CopyStatusEnum.NOT_IMPLEMENTED)) return CopyStatusEnum.PARTIAL;
		return CopyStatusEnum.SUCCESS;
	}
}
