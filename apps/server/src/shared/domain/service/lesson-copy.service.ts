import { Configuration } from '@hpi-schul-cloud/commons';
import { Injectable } from '@nestjs/common';
import { TaskRepo } from '@shared/repo/task/task.repo';
import { randomBytes } from 'crypto';
import {
	ComponentType,
	Course,
	IComponentEtherpadProperties,
	IComponentGeogebraProperties,
	IComponentInternalProperties,
	IComponentProperties,
	Lesson,
	User,
} from '../entity';
import { CopyElementType, CopyStatus, CopyStatusEnum } from '../types';
import { CopyHelperService } from './copy-helper.service';
import { EtherpadService } from './etherpad.service';
import { TaskCopyService } from './task-copy.service';

export type LessonCopyParams = {
	originalLesson: Lesson;
	destinationCourse: Course;
	user: User;
	copyName?: string;
};

@Injectable()
export class LessonCopyService {
	constructor(
		private readonly copyHelperService: CopyHelperService,
		private readonly taskCopyService: TaskCopyService,
		private readonly etherpadService: EtherpadService,
		private readonly taskRepo: TaskRepo
	) {}

	async copyLesson(params: LessonCopyParams): Promise<CopyStatus> {
		const { copiedContent, contentStatus } = await this.copyLessonContent(params.originalLesson.contents || [], params);
		const copy = new Lesson({
			course: params.destinationCourse,
			hidden: true,
			name: params.copyName ?? params.originalLesson.name,
			position: params.originalLesson.position,
			contents: copiedContent,
		});

		const copiedTasksStatus: CopyStatus[] = this.copyLinkedTasks(copy, params);

		const elements = [...LessonCopyService.lessonStatusMetadata(), ...contentStatus, ...copiedTasksStatus];

		const status: CopyStatus = {
			title: copy.name,
			type: CopyElementType.LESSON,
			status: this.copyHelperService.deriveStatusFromElements(elements),
			copyEntity: copy,
			originalEntity: params.originalLesson,
			elements,
		};

		return status;
	}

	private async copyLessonContent(
		content: IComponentProperties[],
		params: LessonCopyParams
	): Promise<{
		copiedContent: IComponentProperties[];
		contentStatus: CopyStatus[];
	}> {
		const etherpadEnabled = Configuration.get('FEATURE_ETHERPAD_ENABLED') as boolean;
		const copiedContent: IComponentProperties[] = [];
		const copiedContentStatus: CopyStatus[] = [];
		for (let i = 0; i < content.length; i += 1) {
			const element = content[i];
			if (element.component === ComponentType.TEXT || element.component === ComponentType.LERNSTORE) {
				copiedContent.push(element);
				copiedContentStatus.push({
					title: element.title,
					type: CopyElementType.LESSON_CONTENT,
					status: CopyStatusEnum.SUCCESS,
				});
			}
			if (element.component === ComponentType.GEOGEBRA) {
				const geoGebraContent = LessonCopyService.copyGeogebra(element);
				copiedContent.push(geoGebraContent);
				copiedContentStatus.push({
					title: element.title,
					type: CopyElementType.LESSON_CONTENT,
					status: CopyStatusEnum.PARTIAL,
				});
			}
			if (element.component === ComponentType.ETHERPAD && etherpadEnabled) {
				// eslint-disable-next-line no-await-in-loop
				const etherpadContent = await this.copyEtherpad(element, params);
				const etherpadStatus = {
					title: element.title,
					type: CopyElementType.LESSON_CONTENT,
					status: CopyStatusEnum.PARTIAL,
				};
				if (etherpadContent) {
					copiedContent.push(etherpadContent);
				} else {
					etherpadStatus.status = CopyStatusEnum.FAIL;
				}
				copiedContentStatus.push(etherpadStatus);
			}
			if (element.component === ComponentType.INTERNAL) {
				// eslint-disable-next-line no-await-in-loop
				const internalContent = await this.copyEmbeddedTask(element, params);
			}
		}
		const contentStatus = this.lessonStatusContent(copiedContentStatus);
		return { copiedContent, contentStatus };
	}

	private static copyGeogebra(originalElement: IComponentProperties): IComponentProperties {
		const copy = { ...originalElement, hidden: true } as IComponentProperties;
		copy.content = { ...copy.content, materialId: '' } as IComponentGeogebraProperties;
		return copy;
	}

	private copyLinkedTasks(destinationLesson: Lesson, params: LessonCopyParams) {
		const linkedTasks = params.originalLesson.getLessonLinkedTasks();
		const copiedTasksStatus: CopyStatus[] = [];
		if (linkedTasks.length > 0) {
			linkedTasks.forEach((element) => {
				const taskStatus = this.taskCopyService.copyTaskMetadata({
					originalTask: element,
					destinationCourse: params.destinationCourse,
					destinationLesson,
					user: params.user,
				});
				copiedTasksStatus.push(taskStatus);
			});
			const taskGroupStatus = {
				type: CopyElementType.TASK_GROUP,
				status: this.copyHelperService.deriveStatusFromElements(copiedTasksStatus),
				elements: copiedTasksStatus,
			};
			return [taskGroupStatus];
		}
		return [];
	}

	private async copyEtherpad(
		originalElement: IComponentProperties,
		params: LessonCopyParams
	): Promise<IComponentProperties | false> {
		const copy = { ...originalElement } as IComponentProperties;
		const content = { ...copy.content, url: '' } as IComponentEtherpadProperties;
		content.title = randomBytes(12).toString('hex');

		const etherpadPadId = await this.etherpadService.createEtherpad(
			params.user.id,
			params.destinationCourse.id,
			content.title,
			''
		);
		if (etherpadPadId) {
			const etherpadUri = Configuration.get('ETHERPAD__PAD_URI') as string;
			content.url = `${etherpadUri}/${etherpadPadId}`;
			copy.content = content;
			return copy;
		}
		return false;
	}

	private async copyEmbeddedTask(
		originalElement: IComponentProperties,
		destinationLesson: Lesson,
		params: LessonCopyParams
	) {
		const copy = { ...originalElement } as IComponentProperties;
		const content = { ...copy.content } as IComponentInternalProperties;
		const urlSplit = content.url.split('/');
		if (urlSplit.includes('homework')) {
			const taskId = urlSplit.at(-1) || '';
			const originalTask = await this.taskRepo.findById(taskId);
			const taskStatus = this.taskCopyService.copyTaskMetadata({
				originalTask,
				destinationCourse: params.destinationCourse,
				destinationLesson,
				user: params.user,
			});
		}
	}

	private static lessonStatusMetadata(): CopyStatus[] {
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
