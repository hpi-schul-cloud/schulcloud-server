import { CopyDictionary, CopyElementType, CopyHelperService, CopyStatus, CopyStatusEnum } from '@modules/copy-helper';
import { CopyFilesService, FileUrlReplacement } from '@modules/files-storage-client';
import { TaskCopyService } from '@modules/task';
import { Inject, Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { randomBytes } from 'crypto';
import { LESSON_CONFIG_TOKEN, LessonConfig } from '../../lesson.config';
import {
	ComponentEtherpadProperties,
	ComponentGeogebraProperties,
	ComponentLernstoreProperties,
	ComponentProperties,
	ComponentTextProperties,
	ComponentType,
	LessonEntity,
	LessonRepo,
	Material,
} from '../../repo';
import { LessonCopyParams } from '../types';
import { EtherpadService } from './etherpad.service';

@Injectable()
export class LessonCopyService {
	constructor(
		private readonly copyHelperService: CopyHelperService,
		private readonly taskCopyService: TaskCopyService,
		private readonly etherpadService: EtherpadService,
		private readonly lessonRepo: LessonRepo,
		private readonly copyFilesService: CopyFilesService,
		@Inject(LESSON_CONFIG_TOKEN) private readonly config: LessonConfig
	) {}

	public async copyLesson(params: LessonCopyParams): Promise<CopyStatus> {
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
	): { status: CopyStatus; elements: CopyStatus[] } {
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

	public updateCopiedEmbeddedTasks(lessonStatus: CopyStatus, copyDict: CopyDictionary): CopyStatus {
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
		const extractTaskId = (url: string): EntityId => {
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
		const copyPromises = content.map((element) => this.copySingleLessonContent(element, params));
		const results = (await Promise.all(copyPromises)).filter((result) => result !== undefined);

		const copiedContent = results.map((result) => result.copy).filter((copy) => copy !== undefined);
		const copiedContentStatus = results.map((result) => result.status);

		const contentStatus = this.lessonStatusContent(copiedContentStatus);
		return { copiedContent, contentStatus };
	}

	private async copySingleLessonContent(
		element: ComponentProperties,
		params: LessonCopyParams
	): Promise<{ copy: ComponentProperties | undefined; status: CopyStatus } | undefined> {
		if (this.isTypeThatShouldBeCopied(element.component)) {
			try {
				const copy = await this.copyFunctionMap[element.component](element, params);
				const status = this.statusMap[element.component](element.title);
				return { copy, status };
			} catch (error) {
				const status = this.statusMap[element.component](element.title);
				status.status = CopyStatusEnum.FAIL;
				return { copy: undefined, status };
			}
		}
	}

	private isTypeThatShouldBeCopied(type: ComponentType): boolean {
		const etherpadEnabled = this.config.featureEtherpadEnabled;

		return etherpadEnabled || type !== ComponentType.ETHERPAD;
	}

	private statusMap: Record<ComponentType, (title: string) => CopyStatus> = {
		[ComponentType.TEXT]: (title: string) => {
			return {
				title,
				type: CopyElementType.LESSON_CONTENT_TEXT,
				status: CopyStatusEnum.SUCCESS,
			};
		},
		[ComponentType.LERNSTORE]: (title: string) => {
			return {
				title,
				type: CopyElementType.LESSON_CONTENT_LERNSTORE,
				status: CopyStatusEnum.SUCCESS,
			};
		},
		[ComponentType.GEOGEBRA]: (title: string) => {
			return {
				title,
				type: CopyElementType.LESSON_CONTENT_GEOGEBRA,
				status: CopyStatusEnum.PARTIAL,
			};
		},
		[ComponentType.ETHERPAD]: (title: string) => {
			return {
				title,
				type: CopyElementType.LESSON_CONTENT_ETHERPAD,
				status: CopyStatusEnum.PARTIAL,
			};
		},
		[ComponentType.INTERNAL]: (title: string) => {
			return {
				title,
				type: CopyElementType.LESSON_CONTENT_TASK,
				status: CopyStatusEnum.SUCCESS,
			};
		},
	};

	private copyFunctionMap: Record<
		ComponentType,
		(el: ComponentProperties, params: LessonCopyParams) => Promise<ComponentProperties>
	> = {
		[ComponentType.TEXT]: this.copyTextContent.bind(this),
		[ComponentType.LERNSTORE]: this.copyLernStore.bind(this),
		[ComponentType.GEOGEBRA]: this.copyGeogebra.bind(this),
		[ComponentType.ETHERPAD]: this.copyEtherpad.bind(this),
		[ComponentType.INTERNAL]: this.copyEmbeddedTaskLink.bind(this),
	};

	private copyTextContent(element: ComponentProperties): Promise<ComponentProperties> {
		return Promise.resolve({
			title: element.title,
			hidden: element.hidden,
			component: ComponentType.TEXT,
			user: element.user, // TODO should be params.user - but that made the server crash, but property is normally undefined
			content: {
				text: (element.content as ComponentTextProperties).text,
			},
		});
	}

	private copyLernStore(element: ComponentProperties): Promise<ComponentProperties> {
		const lernstore: ComponentProperties = {
			title: element.title,
			hidden: element.hidden,
			component: ComponentType.LERNSTORE,
			user: element.user, // TODO should be params.user - but that made the server crash, but property is normally undefined
		};

		if (element.content) {
			const resources = ((element.content as ComponentLernstoreProperties).resources ?? []).map(
				({ client, description, title, url }) => {
					const result = {
						client,
						description,
						title,
						url,
					};
					return result;
				}
			);

			const lernstoreContent: ComponentLernstoreProperties = { resources };
			lernstore.content = lernstoreContent;
		}

		return Promise.resolve(lernstore);
	}

	private copyGeogebra(originalElement: ComponentProperties): Promise<ComponentProperties> {
		const copy = { ...originalElement, hidden: true } as ComponentProperties;
		copy.content = { ...copy.content, materialId: '' } as ComponentGeogebraProperties;
		delete copy._id;
		return Promise.resolve(copy);
	}

	private async copyEtherpad(
		originalElement: ComponentProperties,
		params: LessonCopyParams
	): Promise<ComponentProperties> {
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
			const etherpadUri = this.config.padUri;
			content.url = `${etherpadUri}/${etherpadPadId}`;
			copy.content = content;
			return copy;
		}
		throw new Error('Failed to create etherpad');
	}

	private async copyLinkedTasks(
		destinationLesson: LessonEntity,
		lesson: LessonEntity,
		params: LessonCopyParams
	): Promise<CopyStatus[]> {
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

	private copyEmbeddedTaskLink(originalElement: ComponentProperties): Promise<ComponentProperties> {
		const copy = JSON.parse(JSON.stringify(originalElement)) as ComponentProperties;
		delete copy._id;
		return Promise.resolve(copy);
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
