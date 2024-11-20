import { FileDto, FilesStorageClientAdapterService } from '@modules/files-storage-client';
import { Injectable } from '@nestjs/common';
import { ErrorLogger, Logger } from '@src/core/logger';
import { FilesStorageRestClientAdapter } from '@src/infra/files-storage-client';
import { BoardClientAdapter, BoardSkeletonDto, ColumnSkeletonDto } from '../common-cartridge-client/board-client';
import { CardClientAdapter } from '../common-cartridge-client/card-client/card-client.adapter';
import { CardListResponseDto } from '../common-cartridge-client/card-client/dto/card-list-response.dto';
import { CardResponseDto } from '../common-cartridge-client/card-client/dto/card-response.dto';
import { FileElementResponseDto } from '../common-cartridge-client/card-client/dto/file-element-response.dto';
import { LinkElementResponseDto } from '../common-cartridge-client/card-client/dto/link-element-response.dto';
import { RichTextElementResponseDto } from '../common-cartridge-client/card-client/dto/rich-text-element-response.dto';
import { CardResponseElementsInnerDto } from '../common-cartridge-client/card-client/types/card-response-elements-inner.type';
import { CourseCommonCartridgeMetadataDto, CoursesClientAdapter } from '../common-cartridge-client/course-client';
import { LessonContentDto, LessonDto } from '../common-cartridge-client/lesson-client/dto';
import { LessonClientAdapter } from '../common-cartridge-client/lesson-client/lesson-client.adapter';
import { CourseRoomsClientAdapter } from '../common-cartridge-client/room-client';
import { BoardColumnBoardDto } from '../common-cartridge-client/room-client/dto/board-column-board.dto';
import { BoardElementDto } from '../common-cartridge-client/room-client/dto/board-element.dto';
import { BoardLessonDto } from '../common-cartridge-client/room-client/dto/board-lesson.dto';
import { BoardTaskDto } from '../common-cartridge-client/room-client/dto/board-task.dto';
import { RoomBoardDto } from '../common-cartridge-client/room-client/dto/room-board.dto';
import { BoardElementDtoType } from '../common-cartridge-client/room-client/enums/board-element.enum';
import { CommonCartridgeFileBuilder } from '../export/builders/common-cartridge-file-builder';
import { CommonCartridgeOrganizationNode } from '../export/builders/common-cartridge-organization-node';
import { CommonCartridgeVersion } from '../export/common-cartridge.enums';
import { createIdentifier } from '../export/utils';
import { CommonCartridgeExportMapper } from './common-cartridge.mapper';

const isRichTextElement = (reference: unknown): reference is RichTextElementResponseDto =>
	reference instanceof RichTextElementResponseDto;

const isLinkElement = (reference: unknown): reference is LinkElementResponseDto =>
	reference instanceof LinkElementResponseDto;

const isFileElement = (reference: unknown): reference is FileElementResponseDto =>
	reference instanceof FileElementResponseDto;

@Injectable()
export class CommonCartridgeExportService {
	constructor(
		private readonly filesService: FilesStorageClientAdapterService,
		private readonly boardClientAdapter: BoardClientAdapter,
		private readonly cardClientAdapter: CardClientAdapter,
		private readonly coursesClientAdapter: CoursesClientAdapter,
		private readonly courseRoomsClientAdapter: CourseRoomsClientAdapter,
		private readonly lessonClinetAdapter: LessonClientAdapter,
		private readonly filesStorageClient: FilesStorageClientAdapterService,
		private readonly filesStorageClientAdapter: FilesStorageRestClientAdapter,
		private readonly mapper: CommonCartridgeExportMapper,
		private readonly logger: Logger,
		private readonly errorLogger: ErrorLogger
	) {
		this.logger.setContext(CommonCartridgeExportService.name);
		this.logger.warning({
			getLogMessage() {
				return {
					message: 'Common cartridge export service initialized',
				};
			},
		});
	}

	public async findCourseCommonCartridgeMetadata(courseId: string): Promise<CourseCommonCartridgeMetadataDto> {
		const courseCommonCartridgeMetadata = await this.coursesClientAdapter.getCourseCommonCartridgeMetadata(courseId);

		return courseCommonCartridgeMetadata;
	}

	public async findRoomBoardByCourseId(courseId: string): Promise<RoomBoardDto> {
		const courseRooms = await this.courseRoomsClientAdapter.getRoomBoardByCourseId(courseId);

		return courseRooms;
	}

	public async findBoardSkeletonById(boardId: string): Promise<BoardSkeletonDto> {
		const boardSkeleton = await this.boardClientAdapter.getBoardSkeletonById(boardId);

		return boardSkeleton;
	}

	public async findAllCardsByIds(ids: Array<string>): Promise<CardListResponseDto> {
		const cards = await this.cardClientAdapter.getAllBoardCardsByIds(ids);

		return cards;
	}

	private async findLessonById(lessonId: string): Promise<LessonDto> {
		const lesson = await this.lessonClinetAdapter.getLessonById(lessonId);

		return lesson;
	}

	// export course to common cartridge
	public async exportCourse(
		courseId: string,
		version: CommonCartridgeVersion,
		exportedTopics: string[],
		exportedTasks: string[],
		exportedColumnBoards: string[]
	): Promise<Buffer> {
		const builder = new CommonCartridgeFileBuilder(this.mapper.mapCourseToManifestNew(version, courseId));

		const courseCommonCartridgeMetadata: CourseCommonCartridgeMetadataDto =
			await this.findCourseCommonCartridgeMetadata(courseId);

		builder.addMetadata(this.mapper.mapCourseToMetadata(courseCommonCartridgeMetadata));

		// get room board and the structure of the course
		const roomBoard: RoomBoardDto = await this.findRoomBoardByCourseId(courseId);

		// add lessons to organization
		await this.addLessons(builder, version, roomBoard.elements, exportedTopics);

		// add tasks to organization
		await this.addTasks(builder, version, roomBoard.elements, exportedTasks);

		// add column boards and cards to organization
		await this.addColumnBoards(builder, roomBoard.elements, exportedColumnBoards);

		return builder.build();
	}

	public async findCourseFileRecords(courseId: string): Promise<FileDto[]> {
		const courseFiles = await this.filesService.listFilesOfParent(courseId);

		return courseFiles;
	}

	private addComponentToOrganization(
		component: LessonContentDto,
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

	private async addLessons(
		builder: CommonCartridgeFileBuilder,
		version: CommonCartridgeVersion,
		elements: BoardElementDto[],
		topics: string[]
	): Promise<void> {
		const filteredLessons = this.filterLessonFromBoardElements(elements);
		const lessonsIds = filteredLessons.filter((lesson) => topics.includes(lesson.id)).map((lesson) => lesson.id);

		if (!lessonsIds) {
			return;
		}

		const lessons = await Promise.all(lessonsIds.map((elementId) => this.findLessonById(elementId)));

		lessons.forEach((lesson) => {
			const lessonsOrganization = builder.createOrganization(this.mapper.mapLessonToOrganization(lesson));

			lesson.contents.forEach((content) => {
				this.addComponentToOrganization(content, lessonsOrganization);
			});

			lesson.linkedTasks?.forEach((task) => {
				lessonsOrganization.addResource(this.mapper.mapLinkedTaskToResource(task, version));
			});
		});
	}

	private async addTasks(
		builder: CommonCartridgeFileBuilder,
		version: CommonCartridgeVersion,
		elements: BoardElementDto[],
		exportedTasks: string[]
	): Promise<void> {
		const tasks: BoardTaskDto[] = this.filterTasksFromBoardElements(elements).filter((task) =>
			exportedTasks.includes(task.id)
		);

		if (tasks.length === 0) {
			return;
		}

		const tasksOrganization = builder.createOrganization({
			title: 'Aufgaben',
			identifier: createIdentifier(),
		});

		for await (const task of tasks) {
			tasksOrganization.addResource(this.mapper.mapTaskToResource(task, version));

			const files = await this.downloadFiles(task.id);

			for await (const file of files) {
				tasksOrganization.addResource(this.mapper.mapFileElementToResource(file));
			}
		}
	}

	private async addColumnBoards(
		builder: CommonCartridgeFileBuilder,
		elements: BoardElementDto[],
		exportedColumnBoards: string[]
	): Promise<void> {
		const columnBoards = this.filterColumnBoardFromBoardElement(elements);
		const columnBoardsIds = columnBoards
			.filter((columBoard) => exportedColumnBoards.includes(columBoard.columnBoardId))
			.map((columBoard) => columBoard.columnBoardId);

		if (!columnBoardsIds) {
			return;
		}

		const boardSkeletons: BoardSkeletonDto[] = await Promise.all(
			columnBoardsIds.map((elementId) => this.findBoardSkeletonById(elementId))
		);

		await Promise.all(
			boardSkeletons.map(async (boardSkeleton) => {
				const columnBoardOrganization = builder.createOrganization({
					title: boardSkeleton.title,
					identifier: createIdentifier(boardSkeleton.boardId),
				});

				await Promise.all(
					boardSkeleton.columns.map((column) => this.addColumnToOrganization(column, columnBoardOrganization))
				);
			})
		);
	}

	private async addColumnToOrganization(
		column: ColumnSkeletonDto,
		columnBoardOrganization: CommonCartridgeOrganizationNode
	): Promise<void> {
		const { columnId } = column;
		const columnOrganization = columnBoardOrganization.createChild({
			title: column.title ?? '',
			identifier: createIdentifier(columnId),
		});

		const cardsIds = column.cards.map((card) => card.cardId);
		const listOfCards: CardListResponseDto = await this.findAllCardsByIds(cardsIds);

		for await (const card of listOfCards.data) {
			await this.addCardToOrganization(card, columnOrganization);
		}
	}

	private async addCardToOrganization(
		card: CardResponseDto,
		columnOrganization: CommonCartridgeOrganizationNode
	): Promise<void> {
		const cardOrganization = columnOrganization.createChild({
			title: card.title ?? '',
			identifier: createIdentifier(card.id),
		});

		for await (const element of card.elements) {
			await this.addCardElementToOrganization(element, cardOrganization);
		}
	}

	private async addCardElementToOrganization(
		element: CardResponseElementsInnerDto,
		cardOrganization: CommonCartridgeOrganizationNode
	): Promise<void> {
		if (isRichTextElement(element)) {
			const resource = this.mapper.mapRichTextElementToResource(element);

			cardOrganization.addResource(resource);
		}

		if (isLinkElement(element)) {
			const resource = this.mapper.mapLinkElementToResource(element);

			cardOrganization.addResource(resource);
		}

		if (isFileElement(element)) {
			const files = await this.downloadFiles(element.id);
			const resources = files.map((f) => this.mapper.mapFileElementToResource(f, element));

			resources.forEach((resource) => cardOrganization.addResource(resource));
		}
	}

	private filterTasksFromBoardElements(elements: BoardElementDto[]): BoardTaskDto[] {
		const tasks: BoardTaskDto[] = elements
			.filter((element) => element.type === BoardElementDtoType.TASK)
			.map((element) => element.content as BoardTaskDto);

		return tasks;
	}

	private filterLessonFromBoardElements(elements: BoardElementDto[]): BoardLessonDto[] {
		const lessons: BoardLessonDto[] = elements
			.filter((element) => element.content instanceof BoardLessonDto)
			.map((element) => element.content as BoardLessonDto);

		return lessons;
	}

	private filterColumnBoardFromBoardElement(elements: BoardElementDto[]): BoardColumnBoardDto[] {
		const columnBoard: BoardColumnBoardDto[] = elements
			.filter((element) => element.type === BoardElementDtoType.COLUMN_BOARD)
			.map((element) => element.content as BoardColumnBoardDto);

		return columnBoard;
	}

	// eslint-disable-next-line @typescript-eslint/require-await
	private async downloadFiles(parentId: string): Promise<{ fileRecord: FileDto; file: Buffer }[]> {
		try {
			// const fileRecords = await this.filesStorageClient.listFilesOfParent(parentId);

			const files = new Array<{ fileRecord: FileDto; file: Buffer }>();

			// for await (const fileRecord of fileRecords) {
			// 	// const chunks: Uint8Array[] = [];
			// 	const response = await this.filesStorageClientAdapter.download(fileRecord.id, fileRecord.name);

			// 	console.warn('response', response);

			// 	this.logger.warning({
			// 		getLogMessage() {
			// 			return {
			// 				message: `Files sroeage response for file ${fileRecord.name} for parent ${parentId}`,
			// 				type: typeof response,
			// 				data: response as unknown as string,
			// 			};
			// 		},
			// 	});

			// 	const file = response.data;

			// 	// const file: Buffer = await new Promise((resolve, reject) => {
			// 	// 	response.data.on('data', (chunk: Uint8Array) => {
			// 	// 		chunks.push(chunk);
			// 	// 	});

			// 	// 	response.data.on('end', () => {
			// 	// 		resolve(Buffer.concat(chunks));
			// 	// 	});

			// 	// 	response.data.on('error', (error) => {
			// 	// 		reject(error);
			// 	// 	});
			// 	// });

			// 	this.logger.warning({
			// 		getLogMessage() {
			// 			return {
			// 				message: `Downloaded file ${fileRecord.name} for parent ${parentId}`,
			// 				type: typeof file,
			// 				data: file as unknown as string,
			// 			};
			// 		},
			// 	});

			// 	files.push({ fileRecord, file });
			// }

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
