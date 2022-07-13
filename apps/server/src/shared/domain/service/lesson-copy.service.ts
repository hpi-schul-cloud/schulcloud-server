import { Injectable } from '@nestjs/common';
import { ComponentType, Course, IComponentGeogebraProperties, IComponentProperties, Lesson, User } from '../entity';
import { CopyElementType, CopyStatus, CopyStatusEnum } from '../types';
import { CopyHelperService } from './copy-helper.service';
import { TaskCopyParams, TaskCopyService } from './task-copy.service';

export type LessonCopyParams = {
	originalLesson: Lesson;
	destinationCourse: Course;
	user: User;
};

@Injectable()
export class LessonCopyService {
	constructor(
		private readonly copyHelperService: CopyHelperService,
		private readonly taskCopyService: TaskCopyService
	) {}

	copyLesson(params: LessonCopyParams): CopyStatus {
		const { copiedContent, contentStatus } = this.copyLessonContent(params.originalLesson.contents || []);
		const copy = new Lesson({
			course: params.destinationCourse,
			hidden: true,
			name: this.copyHelperService.deriveCopyName(params.originalLesson.name),
			position: params.originalLesson.position,
			contents: copiedContent,
		});

		const linkedTasks = params.originalLesson.getLessonTasks();
		const copiedTasksStatus: CopyStatus[] = [];
		linkedTasks.forEach((element) => {
			const taskStatus = this.copyTasks({
				originalTask: element,
				destinationCourse: params.destinationCourse,
				destinationLesson: copy,
				user: params.user,
			});
			copiedTasksStatus.push(taskStatus);
		});

		const elements = [...this.lessonStatusMetadata(), ...contentStatus, ...copiedTasksStatus];

		const status: CopyStatus = {
			title: copy.name,
			type: CopyElementType.LESSON,
			status: this.copyHelperService.deriveStatusFromElements(elements),
			copyEntity: copy,
			elements,
		};

		return status;
	}

	private copyLessonContent(content: IComponentProperties[]): {
		copiedContent: IComponentProperties[];
		contentStatus: CopyStatus[];
	} {
		const copiedContent: IComponentProperties[] = [];
		const copiedContentStatus: CopyStatus[] = [];
		content.forEach((element) => {
			if (element.component === ComponentType.TEXT || element.component === ComponentType.LERNSTORE) {
				copiedContent.push(element);
				copiedContentStatus.push({
					title: element.title,
					type: CopyElementType.LESSON_CONTENT,
					status: CopyStatusEnum.SUCCESS,
				});
			} else if (element.component === ComponentType.GEOGEBRA) {
				const geoGebraContent = this.copyGeogebra(element);
				copiedContent.push(geoGebraContent);
				copiedContentStatus.push({
					title: element.title,
					type: CopyElementType.LESSON_CONTENT,
					status: CopyStatusEnum.PARTIAL,
				});
			}
		});
		const contentStatus = this.lessonStatusContent(copiedContentStatus);
		return { copiedContent, contentStatus };
	}

	private copyGeogebra(originalElement: IComponentProperties): IComponentProperties {
		const copy = { ...originalElement, hidden: true };
		const content = { ...copy.content, materialId: '' } as IComponentGeogebraProperties;
		copy.content = content;
		return copy;
	}

	private copyTasks(params: TaskCopyParams): CopyStatus {
		const { copyEntity, ...taskStatus } = this.taskCopyService.copyTaskMetadata(params);
		return taskStatus;
	}

	private lessonStatusMetadata(): CopyStatus[] {
		return [
			{
				type: CopyElementType.METADATA,
				status: CopyStatusEnum.SUCCESS,
			},
		];
	}

	private lessonStatusContent(elements: CopyStatus[]): CopyStatus[] {
		if (elements.length > 0) {
			const componentStatus = {
				type: CopyElementType.LESSON_CONTENT_GROUP,
				status: this.copyHelperService.deriveStatusFromElements(elements),
				elements,
			};
			return [componentStatus];
		}
		return [];
	}
}
