import { Configuration } from '@hpi-schul-cloud/commons';
import { CopyDictionary, CopyElementType, CopyHelperService, CopyStatus, CopyStatusEnum } from '@modules/copy-helper';
import { CopyFilesService, FileUrlReplacement } from '@modules/files-storage-client';
import { TaskCopyService } from '@modules/task';
import { Injectable } from '@nestjs/common';
import {
	ComponentEtherpadProperties,
	ComponentGeogebraProperties,
	ComponentLernstoreProperties,
	ComponentNexboardProperties,
	ComponentProperties,
	ComponentTextProperties,
	ComponentType,
	LessonEntity,
	Material,
} from '@shared/domain/entity';
import { randomBytes } from 'crypto';
import { LessonRepo } from '../repository';
import { LessonCopyParams } from '../types';
import { EtherpadService } from './etherpad.service';
import { NexboardService } from './nexboard.service';

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
		const lesson: LessonEntity = await this.lessonRepo.findById(params.originalLessonId);
		const { copiedContent, contentStatus } = await this.copyLessonContent(lesson.contents, params);
		const { copiedMaterials, materialsStatus } = this.copyLinkedMaterials(lesson);

		const lessonCopy = new LessonEntity({
			course: params.destinationCourse,
			hidden: true,
			name: params.copyName ?? lesson.name,
			position: lesson.position,
			contents: copiedContent,
			materials: copiedMaterials,
		});

		await this.lessonRepo.createLesson(lessonCopy);

		const copiedTasksStatus: CopyStatus[] = await this.copyLinkedTasks(lessonCopy, lesson, params);

		const { status, elements } = this.deriveCopyStatus(
			contentStatus,
			materialsStatus,
			copiedTasksStatus,
			lessonCopy,
			lesson
		);

		await this.lessonRepo.save(lessonCopy);
		const copyDict = this.copyHelperService.buildCopyEntityDict(status);
		const updatedStatus = this.updateCopiedEmbeddedTasks(status, copyDict);

		const { fileUrlReplacements, fileCopyStatus } = await this.copyFilesService.copyFilesOfEntity(
			lesson,
			lessonCopy,
			params.user.id
		);

		elements.push(fileCopyStatus);
		lessonCopy.contents = this.replaceUrlsInContents(lessonCopy.contents, fileUrlReplacements);

		updatedStatus.status = this.copyHelperService.deriveStatusFromElements(elements);
		await this.lessonRepo.save(lessonCopy);

		return updatedStatus;
	}

	private deriveCopyStatus(
		contentStatus: CopyStatus[],
		materialsStatus: CopyStatus[],
		copiedTasksStatus: CopyStatus[],
		lessonCopy: LessonEntity,
		originalLesson: LessonEntity
	) {
		const elements: CopyStatus[] = [
			...LessonCopyService.lessonStatusMetadata(),
			...contentStatus,
			...materialsStatus,
			...copiedTasksStatus,
		];

		const status: CopyStatus = {
			title: lessonCopy.name,
			type: CopyElementType.LESSON,
			status: this.copyHelperService.deriveStatusFromElements(elements),
			copyEntity: lessonCopy,
			originalEntity: originalLesson,
			elements,
		};
		return { status, elements };
	}

	updateCopiedEmbeddedTasks(lessonStatus: CopyStatus, copyDict: CopyDictionary): CopyStatus {
		const copiedLesson = lessonStatus.copyEntity as LessonEntity;

		if (copiedLesson?.contents === undefined) {
			return lessonStatus;
		}

		copiedLesson.contents = copiedLesson.contents.map((value: ComponentProperties) =>
			this.updateCopiedEmbeddedTaskId(value, copyDict)
		);

		lessonStatus.copyEntity = copiedLesson;

		return lessonStatus;
	}

	private updateCopiedEmbeddedTaskId = (value: ComponentProperties, copyDict: CopyDictionary): ComponentProperties => {
		if (value.component !== ComponentType.INTERNAL || value.content === undefined || value.content.url === undefined) {
			return value;
		}

		const { content } = value;
		const extractTaskId = (url: string) => {
			const urlObject = new URL(url, 'https://www.example.com');
			const taskId = urlObject.pathname.split('/')[2];
			return taskId;
		};

		const originalTaskId = extractTaskId(content.url);
		const copiedTask = copyDict.get(originalTaskId);
		if (!copiedTask) {
			return value;
		}

		const url = content.url.replace(originalTaskId, copiedTask.id);
		const updateded = { ...value, content: { url } };
		return updateded;
	};

	private replaceUrlsInContents(
		contents: ComponentProperties[],
		fileUrlReplacements: FileUrlReplacement[]
	): ComponentProperties[] {
		contents = contents.map((item: ComponentProperties) => {
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

	private async copyLessonContent(
		content: ComponentProperties[],
		params: LessonCopyParams
	): Promise<{
		copiedContent: ComponentProperties[];
		contentStatus: CopyStatus[];
	}> {
		const etherpadEnabled = Configuration.get('FEATURE_ETHERPAD_ENABLED') as boolean;
		const nexboardCopyEnabled = Configuration.get('FEATURE_NEXBOARD_COPY_ENABLED') as boolean;
		const copiedContent: ComponentProperties[] = [];
		const copiedContentStatus: CopyStatus[] = [];
		for (let i = 0; i < content.length; i += 1) {
			const element = content[i];
			if (element.component === ComponentType.TEXT) {
				const textContent = this.copyTextContent(element);
				copiedContent.push(textContent);
				copiedContentStatus.push({
					title: element.title,
					type: CopyElementType.LESSON_CONTENT_TEXT,
					status: CopyStatusEnum.SUCCESS,
				});
			}
			if (element.component === ComponentType.LERNSTORE) {
				const lernstoreContent = this.copyLernStore(element);
				copiedContent.push(lernstoreContent);
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

			if (element.component === ComponentType.TLDRAW && tldrawEnabled) {
				const tldrawContent = await this.copyTldraw(element, params);
				const tldrawStatus = {
					title: element.title,
					type: CopyElementType.LESSON_CONTENT_TLDRAW,
					status: CopyStatusEnum.PARTIAL,
				};
				if (tldrawContent) {
					copiedContent.push(tldrawContent);
				} else {
					tldrawStatus.status = CopyStatusEnum.FAIL;
				}
				copiedContentStatus.push(tldrawStatus);
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
			if (element.component === ComponentType.NEXBOARD) {
				const nexboardStatus = {
					title: element.title,
					type: CopyElementType.LESSON_CONTENT_NEXBOARD,
					status: CopyStatusEnum.FAIL,
				};

				if (nexboardCopyEnabled) {
					// eslint-disable-next-line no-await-in-loop
					const nexboardContent = await this.copyNexboard(element, params);

					if (nexboardContent) {
						copiedContent.push(nexboardContent);
						nexboardStatus.status = CopyStatusEnum.PARTIAL;
					}
				}

				copiedContentStatus.push(nexboardStatus);
			}
		}
		const contentStatus = this.lessonStatusContent(copiedContentStatus);
		return { copiedContent, contentStatus };
	}

	private copyTextContent(element: ComponentProperties): ComponentProperties {
		return {
			title: element.title,
			hidden: element.hidden,
			component: ComponentType.TEXT,
			user: element.user, // TODO should be params.user - but that made the server crash, but property is normally undefined
			content: {
				text: (element.content as ComponentTextProperties).text,
			},
		};
	}

	private copyLernStore(element: ComponentProperties): ComponentProperties {
		const lernstore: ComponentProperties = {
			title: element.title,
			hidden: element.hidden,
			component: ComponentType.LERNSTORE,
			user: element.user, // TODO should be params.user - but that made the server crash, but property is normally undefined
		};

		if (element.content) {
			const resources = ((element.content as ComponentLernstoreProperties).resources ?? []).map(
				({ client, description, merlinReference, title, url }) => {
					const result = {
						client,
						description,
						merlinReference,
						title,
						url,
					};
					return result;
				}
			);

			const lernstoreContent: ComponentLernstoreProperties = { resources };
			lernstore.content = lernstoreContent;
		}

		return lernstore;
	}

	private static copyGeogebra(originalElement: ComponentProperties): ComponentProperties {
		const copy = { ...originalElement, hidden: true } as ComponentProperties;
		copy.content = { ...copy.content, materialId: '' } as ComponentGeogebraProperties;
		delete copy._id;
		return copy;
	}

	private async copyEtherpad(
		originalElement: ComponentProperties,
		params: LessonCopyParams
	): Promise<ComponentProperties | false> {
		const copy = { ...originalElement } as ComponentProperties;
		delete copy._id;
		const content = { ...copy.content, url: '' } as ComponentEtherpadProperties;
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
		originalElement: ComponentProperties,
		params: LessonCopyParams
	): Promise<ComponentProperties | false> {
		const copy = { ...originalElement } as ComponentProperties;
		delete copy._id;
		const content = { ...copy.content, url: '', board: '' } as ComponentNexboardProperties;

		const nexboard = await this.nexboardService.createNexboard(params.user.id, content.title, content.description);
		if (nexboard) {
			content.url = nexboard.url;
			content.board = nexboard.board;
			copy.content = content;
			return copy;
		}
		return false;
	}

	private async copyTldraw(
		originalElement: ComponentProperties,
		params: LessonCopyParams
	): Promise<ComponentProperties | false> {
		const copy = { ...originalElement } as ComponentProperties;
		delete copy._id;
		const content = { ...copy.content, url: '', board: '' } as ComponentTldrawProperties;

		cosnt tldraw = await this.
	}


	private async copyLinkedTasks(destinationLesson: LessonEntity, lesson: LessonEntity, params: LessonCopyParams) {
		const linkedTasks = lesson.getLessonLinkedTasks();
		if (linkedTasks.length > 0) {
			const copiedTasksStatus = await Promise.all(
				linkedTasks.map((element) =>
					this.taskCopyService.copyTask({
						originalTaskId: element.id,
						destinationCourse: params.destinationCourse,
						destinationLesson,
						user: params.user,
					})
				)
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

	private copyLinkedMaterials(originalLesson: LessonEntity): {
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

	private copyEmbeddedTaskLink(originalElement: ComponentProperties) {
		const copy = JSON.parse(JSON.stringify(originalElement)) as ComponentProperties;
		delete copy._id;
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
