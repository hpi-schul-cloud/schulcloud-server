import { FilesStorageRestClientAdapter } from '@infra/files-storage-client';
import {
	AnyBoardNode,
	BoardExternalReferenceType,
	Card,
	Column,
	ColumnBoardService,
	isCard,
	isColumn,
	isLinkElement,
	isRichTextElement,
} from '@modules/board';
import {
	CommonCartridgeFileBuilder,
	CommonCartridgeOrganizationNode,
	CommonCartridgeVersion,
	createIdentifier,
} from '@modules/common-cartridge';
import { FileDto, FilesStorageClientAdapterService } from '@modules/files-storage-client';
import { LessonService } from '@modules/lesson';
import { TaskService } from '@modules/task';
import { Injectable } from '@nestjs/common';
import { ComponentProperties } from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';
import { ErrorLogger, Logger } from '@src/core/logger';
import { isFileElement } from '@src/modules/board/domain';
import { CommonCartridgeExportMapper } from '../mapper/common-cartridge-export.mapper';
import { CourseService } from './course.service';

@Injectable()
export class CommonCartridgeExportService {
	constructor(
		private readonly courseService: CourseService,
		private readonly lessonService: LessonService,
		private readonly taskService: TaskService,
		private readonly columnBoardService: ColumnBoardService,
		private readonly mapper: CommonCartridgeExportMapper,
		private readonly filesStorageClient: FilesStorageClientAdapterService,
		private readonly filesStorageClientAdapter: FilesStorageRestClientAdapter,
		private readonly logger: Logger,
		private readonly errorLogger: ErrorLogger
	) {
		this.logger.setContext(CommonCartridgeExportService.name);
	}

	public async exportCourse(
		courseId: EntityId,
		userId: EntityId,
		version: CommonCartridgeVersion,
		exportedTopics: string[],
		exportedTasks: string[],
		exportedColumnBoards: string[]
	): Promise<Buffer> {
		const course = await this.courseService.findById(courseId);
		const builder = new CommonCartridgeFileBuilder(this.mapper.mapCourseToManifest(version, course));

		builder.addMetadata(this.mapper.mapCourseToMetadata(course));

		await this.addLessons(builder, courseId, version, exportedTopics);
		await this.addTasks(builder, courseId, userId, version, exportedTasks);
		await this.addColumnBoards(builder, courseId, exportedColumnBoards);

		return builder.build();
	}

	private async addLessons(
		builder: CommonCartridgeFileBuilder,
		courseId: EntityId,
		version: CommonCartridgeVersion,
		topics: string[]
	): Promise<void> {
		const [lessons] = await this.lessonService.findByCourseIds([courseId]);

		lessons.forEach((lesson) => {
			if (!topics.includes(lesson.id)) {
				return;
			}

			const lessonOrganization = builder.createOrganization(this.mapper.mapLessonToOrganization(lesson));

			lesson.contents.forEach((content) => {
				this.addComponentToOrganization(content, lessonOrganization);
			});

			lesson.getLessonLinkedTasks().forEach((task) => {
				lessonOrganization.addResource(this.mapper.mapTaskToResource(task, version));
			});
		});
	}

	private async addTasks(
		builder: CommonCartridgeFileBuilder,
		courseId: EntityId,
		userId: EntityId,
		version: CommonCartridgeVersion,
		exportedTasks: string[]
	): Promise<void> {
		const [tasks] = await this.taskService.findBySingleParent(userId, courseId);

		if (tasks.length === 0) {
			return;
		}

		const tasksOrganization = builder.createOrganization({
			title: 'Aufgaben',
			identifier: createIdentifier(),
		});

		const promises = tasks.map(async (task) => {
			if (!exportedTasks.includes(task.id)) {
				return;
			}

			tasksOrganization.addResource(this.mapper.mapTaskToResource(task, version));

			const files = await this.downloadFiles(task.id);

			files.forEach((file) => {
				tasksOrganization.addResource(this.mapper.mapFileElementToResource(file));
			});
		});

		await Promise.allSettled(promises);
	}

	private async addColumnBoards(
		builder: CommonCartridgeFileBuilder,
		courseId: EntityId,
		exportedColumnBoards: string[]
	): Promise<void> {
		const columnBoards = (
			await this.columnBoardService.findByExternalReference({
				type: BoardExternalReferenceType.Course,
				id: courseId,
			})
		).filter((cb) => exportedColumnBoards.includes(cb.id));

		for await (const columnBoard of columnBoards) {
			const columnBoardOrganization = builder.createOrganization({
				title: columnBoard.title,
				identifier: createIdentifier(columnBoard.id),
			});

			const promises = columnBoard.children
				.filter((child) => isColumn(child))
				.map((column) => this.addColumnToOrganization(column as Column, columnBoardOrganization));

			await Promise.allSettled(promises);
		}

		// TODO: error handling
		// const promises = columnBoards.map(async (columnBoard) => {
		// 	const columnBoardOrganization = builder.createOrganization({
		// 		title: columnBoard.title,
		// 		identifier: createIdentifier(columnBoard.id),
		// 	});

		// 	const foo = columnBoard.children
		// 		.filter((child) => isColumn(child))
		// 		.map((column) => this.addColumnToOrganization(column as Column, columnBoardOrganization));

		// 	await Promise.allSettled(foo);
		// });

		// await Promise.allSettled(promises);
	}

	private async addColumnToOrganization(
		column: Column,
		columnBoardOrganization: CommonCartridgeOrganizationNode
	): Promise<void> {
		const columnOrganization = columnBoardOrganization.createChild({
			title: column.title || '',
			identifier: createIdentifier(column.id),
		});

		for await (const card of column.children.filter((child) => isCard(child))) {
			await this.addCardToOrganization(card, columnOrganization);
		}

		// const promises = column.children
		// 	.filter((child) => isCard(child))
		// 	.map((card) => this.addCardToOrganization(card, columnOrganization));

		// await Promise.allSettled(promises);
	}

	private async addCardToOrganization(card: Card, columnOrganization: CommonCartridgeOrganizationNode): Promise<void> {
		const cardOrganization = columnOrganization.createChild({
			title: card.title || '',
			identifier: createIdentifier(card.id),
		});

		for await (const child of card.children) {
			await this.addCardElementToOrganization(child, cardOrganization);
		}

		// const promises = card.children.map((child) => this.addCardElementToOrganization(child, cardOrganization));

		// await Promise.allSettled(promises);
	}

	private async addCardElementToOrganization(
		element: AnyBoardNode,
		cardOrganization: CommonCartridgeOrganizationNode
	): Promise<void> {
		if (isRichTextElement(element)) {
			const resource = this.mapper.mapRichTextElementToResource(element);

			cardOrganization.addResource(resource);

			return;
		}

		if (isLinkElement(element)) {
			const resource = this.mapper.mapLinkElementToResource(element);

			cardOrganization.addResource(resource);

			return;
		}

		if (isFileElement(element)) {
			const files = await this.downloadFiles(element.id);
			const resources = files.map((f) => this.mapper.mapFileElementToResource(f, element));

			resources.forEach((resource) => cardOrganization.addResource(resource));
		}
	}

	private addComponentToOrganization(
		component: ComponentProperties,
		lessonOrganization: CommonCartridgeOrganizationNode
	): void {
		const resources = this.mapper.mapContentToResources(component);

		if (Array.isArray(resources)) {
			const componentOrganization = lessonOrganization.createChild(this.mapper.mapContentToOrganization(component));

			resources.forEach((resource) => {
				componentOrganization.addResource(resource);
			});
		} else {
			lessonOrganization.addResource(resources);
		}
	}

	private async downloadFiles(parentId: string): Promise<{ fileRecord: FileDto; file: Buffer }[]> {
		try {
			const fileRecords = await this.filesStorageClient.listFilesOfParent(parentId);

			this.logger.warning({
				getLogMessage() {
					return {
						message: `Found ${fileRecords.length} files for parent ${parentId}`,
						files: fileRecords.map((fileRecord) => fileRecord.name).join(', '),
					};
				},
			});

			const files = new Array<{ fileRecord: FileDto; file: Buffer }>();

			for await (const fileRecord of fileRecords) {
				const file = await this.filesStorageClientAdapter.download(fileRecord.id, fileRecord.name);

				files.push({ fileRecord, file });
			}

			// const filePromises = fileRecords.map(async (fileRecord) => {
			// 	const file = await this.filesStorageClientAdapter.download(fileRecord.id, fileRecord.name);

			// 	return { fileRecord, file };
			// });
			// const results = await Promise.allSettled(filePromises);
			// const files = results.filter((result) => result.status === 'fulfilled').map((filePromise) => filePromise.value);

			// TODO: change to info or debug
			this.logger.warning({
				getLogMessage() {
					return {
						message: `Found ${files.length} files for parent ${parentId}`,
						files: files.map((file) => file.fileRecord.name).join(', '),
					};
				},
			});

			return files;
		} catch (error: unknown) {
			this.errorLogger.error({
				getLogMessage() {
					return {
						message: `Failed to download files for parent ${parentId}`,
						error,
					};
				},
			});

			return [];
		}
	}
}
