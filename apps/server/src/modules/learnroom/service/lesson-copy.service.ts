import { Configuration } from '@hpi-schul-cloud/commons';
import { Injectable } from '@nestjs/common';
import {
	BaseEntity,
	ComponentType,
	CopyElementType,
	CopyHelperService,
	CopyStatus,
	CopyStatusEnum,
	Course,
	EntityId,
	EtherpadService,
	IComponentEtherpadProperties,
	IComponentGeogebraProperties,
	IComponentInternalProperties,
	IComponentNexboardProperties,
	IComponentProperties,
	Lesson,
	Material,
	NexboardService,
	User,
} from '@shared/domain';
import { LessonRepo } from '@shared/repo';
import { CopyFilesService } from '@src/modules/files-storage-client';
import { FileUrlReplacement } from '@src/modules/files-storage-client/service/copy-files.service';
import { randomBytes } from 'crypto';
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
		private readonly nexboardService: NexboardService,
		private readonly lessonRepo: LessonRepo,
		private readonly copyFilesService: CopyFilesService
	) {}

	async copyLesson(params: LessonCopyParams): Promise<CopyStatus> {
		const { copiedContent, contentStatus } = await this.copyLessonContent(params.originalLesson.contents, params);
		const { copiedMaterials, materialsStatus } = this.copyLinkedMaterials(params.originalLesson);
		const lessonCopy = new Lesson({
			course: params.destinationCourse,
			hidden: true,
			name: params.copyName ?? params.originalLesson.name,
			position: params.originalLesson.position,
			contents: copiedContent,
			materials: copiedMaterials,
		});

		const copiedTasksStatus: CopyStatus[] = await this.copyLinkedTasks(lessonCopy, params);

		const elements = [
			...LessonCopyService.lessonStatusMetadata(),
			...contentStatus,
			...materialsStatus,
			...copiedTasksStatus,
		];

		let status: CopyStatus = {
			title: lessonCopy.name,
			type: CopyElementType.LESSON,
			status: this.copyHelperService.deriveStatusFromElements(elements),
			copyEntity: lessonCopy,
			originalEntity: params.originalLesson,
			elements,
		};

		await this.lessonRepo.save(lessonCopy);
		status = this.updateCopiedEmbeddedTasks(status);

		const { fileUrlReplacements, fileCopyStatus } = await this.copyFilesService.copyFilesOfEntity(
			params.originalLesson,
			lessonCopy,
			params.user.id
		);

		elements.push(fileCopyStatus);
		lessonCopy.contents = this.replaceUrlsInContents(lessonCopy.contents, fileUrlReplacements);

		status.status = this.copyHelperService.deriveStatusFromElements(elements);
		await this.lessonRepo.save(lessonCopy);

		return status;
	}

	private replaceUrlsInContents(
		contents: IComponentProperties[],
		fileUrlReplacements: FileUrlReplacement[]
	): IComponentProperties[] {
		contents = contents.map((item: IComponentProperties) => {
			if (item.component === 'text' && item.content && 'text' in item.content && item.content.text) {
				let { text } = item.content;
				fileUrlReplacements.forEach(({ regex, replacement }) => {
					text = text.replace(regex, replacement);
				});
				item.content.text = text;
			}
			return item;
		});

		return contents;
	}

	updateCopiedEmbeddedTasks(status: CopyStatus): CopyStatus {
		const copyDict = this.copyHelperService.buildCopyEntityDict(status);
		return this.updateCopiedEmbeddedTasksRecursive(status, copyDict);
	}

	private updateCopiedEmbeddedTasksRecursive(status: CopyStatus, copyDict: Map<EntityId, BaseEntity>): CopyStatus {
		if (status.type === CopyElementType.LESSON) {
			status = this.updateCopiedEmbeddedTasksOfLesson(status, copyDict);
		}
		if (status.elements) {
			status.elements = status.elements.map((element) => {
				return this.updateCopiedEmbeddedTasksRecursive(element, copyDict);
			});
		}
		return status;
	}

	private updateCopiedEmbeddedTasksOfLesson(lessonStatus: CopyStatus, copyDict: Map<EntityId, BaseEntity>): CopyStatus {
		const copiedLesson = lessonStatus.copyEntity as Lesson;

		copiedLesson.contents = copiedLesson.contents.map((value: IComponentProperties) =>
			this.updateCopiedEmbeddedTasksMapContent(value, copyDict)
		);
		lessonStatus.copyEntity = copiedLesson;

		return lessonStatus;
	}

	private updateCopiedEmbeddedTasksMapContent = (
		value: IComponentProperties,
		copyDict: Map<EntityId, BaseEntity>
	): IComponentProperties => {
		if (value.component !== ComponentType.INTERNAL) {
			return value;
		}
		const content = value.content as IComponentInternalProperties;
		const url = new URL(content.url);
		const originalTaskId = url.pathname.split('/')[2];
		const finalTask = copyDict.get(originalTaskId);
		if (!finalTask) {
			return value;
		}
		const newEmbedded = { ...value, content: { url: content.url.replace(originalTaskId, finalTask.id) } };
		return newEmbedded;
	};

	private async copyLessonContent(
		content: IComponentProperties[],
		params: LessonCopyParams
	): Promise<{
		copiedContent: IComponentProperties[];
		contentStatus: CopyStatus[];
	}> {
		const etherpadEnabled = Configuration.get('FEATURE_ETHERPAD_ENABLED') as boolean;
		const nexboardEnabled = Configuration.get('FEATURE_NEXBOARD_ENABLED') as boolean;
		const copiedContent: IComponentProperties[] = [];
		const copiedContentStatus: CopyStatus[] = [];
		for (let i = 0; i < content.length; i += 1) {
			const element = content[i];
			if (element.component === ComponentType.TEXT) {
				copiedContent.push(element);
				copiedContentStatus.push({
					title: element.title,
					type: CopyElementType.LESSON_CONTENT_TEXT,
					status: CopyStatusEnum.SUCCESS,
				});
			}
			if (element.component === ComponentType.LERNSTORE) {
				copiedContent.push(element);
				copiedContentStatus.push({
					title: element.title,
					type: CopyElementType.LESSON_CONTENT_LERNSTORE,
					status: CopyStatusEnum.SUCCESS,
				});
			}
			if (element.component === ComponentType.GEOGEBRA) {
				const geoGebraContent = LessonCopyService.copyGeogebra(element);
				copiedContent.push(geoGebraContent);
				copiedContentStatus.push({
					title: element.title,
					type: CopyElementType.LESSON_CONTENT_GEOGEBRA,
					status: CopyStatusEnum.PARTIAL,
				});
			}
			if (element.component === ComponentType.ETHERPAD && etherpadEnabled) {
				// eslint-disable-next-line no-await-in-loop
				const etherpadContent = await this.copyEtherpad(element, params);
				const etherpadStatus = {
					title: element.title,
					type: CopyElementType.LESSON_CONTENT_ETHERPAD,
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
				const linkContent = this.copyEmbeddedTaskLink(element);
				const embeddedTaskStatus = {
					title: element.title,
					type: CopyElementType.LESSON_CONTENT_TASK,
					status: CopyStatusEnum.SUCCESS,
				};
				copiedContent.push(linkContent);
				copiedContentStatus.push(embeddedTaskStatus);
			}
			if (element.component === ComponentType.NEXBOARD && nexboardEnabled) {
				// eslint-disable-next-line no-await-in-loop
				const nexboardContent = await this.copyNexboard(element, params);
				const nexboardStatus = {
					title: element.title,
					type: CopyElementType.LESSON_CONTENT_NEXBOARD,
					status: CopyStatusEnum.PARTIAL,
				};
				if (nexboardContent) {
					copiedContent.push(nexboardContent);
				} else {
					nexboardStatus.status = CopyStatusEnum.FAIL;
				}
				copiedContentStatus.push(nexboardStatus);
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
			content.title
		);
		if (etherpadPadId) {
			const etherpadUri = Configuration.get('ETHERPAD__PAD_URI') as string;
			content.url = `${etherpadUri}/${etherpadPadId}`;
			copy.content = content;
			return copy;
		}
		return false;
	}

	private async copyNexboard(
		originalElement: IComponentProperties,
		params: LessonCopyParams
	): Promise<IComponentProperties | false> {
		const copy = { ...originalElement } as IComponentProperties;
		const content = { ...copy.content, url: '', board: '' } as IComponentNexboardProperties;

		const nexboard = await this.nexboardService.createNexboard(params.user.id, content.title, content.description);
		if (nexboard) {
			content.url = nexboard.url;
			content.board = nexboard.board;
			copy.content = content;
			return copy;
		}
		return false;
	}

	private async copyLinkedTasks(destinationLesson: Lesson, params: LessonCopyParams) {
		const linkedTasks = params.originalLesson.getLessonLinkedTasks();
		if (linkedTasks.length > 0) {
			const copiedTasksStatus = await Promise.all(
				linkedTasks.map((element) => {
					return this.taskCopyService.copyTask({
						originalTask: element,
						destinationCourse: params.destinationCourse,
						destinationLesson,
						user: params.user,
					});
				})
			);
			const taskGroupStatus = {
				type: CopyElementType.TASK_GROUP,
				status: this.copyHelperService.deriveStatusFromElements(copiedTasksStatus),
				elements: copiedTasksStatus,
			};
			return [taskGroupStatus];
		}
		return [];
	}

	private copyLinkedMaterials(originalLesson: Lesson): {
		copiedMaterials: Material[];
		materialsStatus: CopyStatus[];
	} {
		const linkedItems = originalLesson.getLessonMaterials();
		const copiedMaterials: Material[] = [];
		const materialsStatus: CopyStatus[] = [];
		if (linkedItems.length > 0) {
			const elementsStatus: CopyStatus[] = [];
			linkedItems.forEach((element) => {
				const material = new Material(element);
				copiedMaterials.push(material);
				const status: CopyStatus = {
					title: element.title,
					type: CopyElementType.LERNSTORE_MATERIAL,
					status: CopyStatusEnum.SUCCESS,
					copyEntity: material,
				};
				elementsStatus.push(status);
			});
			const materialGroupStatus: CopyStatus = {
				type: CopyElementType.LERNSTORE_MATERIAL_GROUP,
				status: this.copyHelperService.deriveStatusFromElements(elementsStatus),
				elements: elementsStatus,
			};
			materialsStatus.push(materialGroupStatus);
		}
		return { copiedMaterials, materialsStatus };
	}

	private copyEmbeddedTaskLink(originalElement: IComponentProperties) {
		const copy = JSON.parse(JSON.stringify(originalElement)) as IComponentProperties;
		return copy;
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
