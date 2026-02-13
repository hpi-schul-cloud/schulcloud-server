import { Logger } from '@core/logger';
import { BoardResponse, BoardsClientAdapter, ColumnResponse } from '@infra/boards-client';
import { CoursesClientAdapter } from '@infra/courses-client';
import { FileRecordScanStatus, FilesStorageClientAdapter } from '@infra/files-storage-client';
import { FileDto, FilesStorageClientAdapterService } from '@modules/files-storage-client';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import archiver from 'archiver';
import { Stream } from 'node:stream';
import { CardClientAdapter } from '../common-cartridge-client/card-client';
import {
	CardListResponseDto,
	CardResponseDto,
	FileElementResponseDto,
	FileFolderElementResponseDto,
	LinkElementResponseDto,
	RichTextElementResponseDto,
} from '../common-cartridge-client/card-client/dto';
import { ContentElementType } from '../common-cartridge-client/card-client/enums/content-element-type.enum';
import { CardResponseElementsInnerDto } from '../common-cartridge-client/card-client/types/card-response-elements-inner.type';
import { LessonClientAdapter } from '../common-cartridge-client/lesson-client';
import { LessonContentDto } from '../common-cartridge-client/lesson-client/dto';
import { CourseRoomsClientAdapter } from '../common-cartridge-client/room-client';
import {
	BoardColumnBoardDto,
	BoardElementDto,
	BoardLessonDto,
	BoardTaskDto,
} from '../common-cartridge-client/room-client/dto';
import { BoardElementDtoType } from '../common-cartridge-client/room-client/enums/board-element.enum';
import { CommonCartridgeFileBuilder } from '../export/builders/common-cartridge-file-builder';
import { CommonCartridgeOrganizationNode } from '../export/builders/common-cartridge-organization-node';
import { CommonCartridgeVersion } from '../export/common-cartridge.enums';
import { createIdentifier } from '../export/utils';
import { CommonCartridgeExportMessageLoggable } from '../loggable/common-cartridge-export-message.loggable';
import { CommonCartridgeExportMapper } from './common-cartridge-export.mapper';
import { CommonCartridgeExportResponse } from './common-cartridge-export.response';

export type FileMetadataAndStream = { name: string; file: Stream; fileDto: FileDto };

@Injectable()
export class CommonCartridgeExportService {
	constructor(
		private readonly boardClientAdapter: BoardsClientAdapter,
		private readonly cardClientAdapter: CardClientAdapter,
		private readonly coursesClientAdapter: CoursesClientAdapter,
		private readonly courseRoomsClientAdapter: CourseRoomsClientAdapter,
		private readonly lessonClientAdapter: LessonClientAdapter,
		private readonly filesMetadataClientAdapter: FilesStorageClientAdapterService,
		private readonly filesStorageClientAdapter: FilesStorageClientAdapter,
		private readonly mapper: CommonCartridgeExportMapper,
		private readonly logger: Logger
	) {
		this.logger.setContext(CommonCartridgeExportService.name);
	}

	public async exportCourse(
		courseId: string,
		version: CommonCartridgeVersion,
		exportedTopics: string[],
		exportedTasks: string[],
		exportedColumnBoards: string[]
	): Promise<CommonCartridgeExportResponse> {
		this.logger.debug(
			new CommonCartridgeExportMessageLoggable('New Common-Cartridge export started', { courseId, version })
		);

		const archive = this.createArchiver(courseId);
		const builder = new CommonCartridgeFileBuilder(
			this.mapper.mapCourseToManifest(version, courseId),
			archive,
			this.logger
		);

		const courseCommonCartridgeMetadata = await this.coursesClientAdapter.getCourseCommonCartridgeMetadata(courseId);
		this.logger.debug(new CommonCartridgeExportMessageLoggable('Loaded course metadata', { courseId }));

		builder.addMetadata(this.mapper.mapCourseToMetadata(courseCommonCartridgeMetadata));

		// get room board and the structure of the course
		const roomBoard = await this.courseRoomsClientAdapter.getRoomBoardByCourseId(courseId);
		this.logger.debug(new CommonCartridgeExportMessageLoggable('Loaded roomboard of course', { courseId }));

		// add lessons to organization
		await this.addLessons(builder, version, roomBoard.elements, exportedTopics);
		this.logger.debug(new CommonCartridgeExportMessageLoggable('Added lessons of course', { courseId }));

		// add tasks to organization
		await this.addTasks(builder, version, roomBoard.elements, exportedTasks);
		this.logger.debug(new CommonCartridgeExportMessageLoggable('Added tasks of course', { courseId }));

		// add column boards and cards to organization
		await this.addColumnBoards(builder, version, roomBoard.elements, exportedColumnBoards);
		this.logger.debug(new CommonCartridgeExportMessageLoggable('Added boards of course', { courseId }));

		builder.build();
		this.logger.debug(new CommonCartridgeExportMessageLoggable('Built archive', { courseId }));

		const response: CommonCartridgeExportResponse = {
			data: builder.archive,
			name: `${roomBoard.title}-${new Date().toISOString()}.imscc`,
		};

		this.logger.debug(new CommonCartridgeExportMessageLoggable('Finished export of course', { courseId }));

		return response;
	}

	private createArchiver(courseId: string): archiver.Archiver {
		const archive = archiver('zip');

		archive.on('warning', (err) => {
			this.logger.warning(
				new CommonCartridgeExportMessageLoggable('Warning while creating archive', {
					courseId,
					cause: JSON.stringify(err),
				})
			);
		});

		archive.on('progress', (progress) => {
			this.logger.debug(
				new CommonCartridgeExportMessageLoggable(
					`Progress for CC export: ${progress.entries.processed} of ${progress.entries.total} total processed.`,
					{ courseId, ...progress }
				)
			);
		});

		archive.on('error', (err) => {
			throw new InternalServerErrorException('Error while creating archive', { cause: err });
		});

		archive.on('close', () => {
			this.logger.debug(
				new CommonCartridgeExportMessageLoggable(`Archive closed. Length: ${archive.pointer()}`, { courseId })
			);
		});

		return archive;
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
		const lessons = await Promise.all(lessonsIds.map((elementId) => this.lessonClientAdapter.getLessonById(elementId)));

		lessons.forEach((lesson) => {
			const lessonsOrganization = builder.createOrganization(this.mapper.mapLessonToOrganization(lesson));

			lesson.contents.forEach((content) => {
				this.addComponentToOrganization(content, lessonsOrganization);
			});

			lesson.linkedTasks.forEach((task) => {
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
		const tasksOrganization = builder.createOrganization({
			title: 'Aufgaben',
			identifier: createIdentifier(),
		});

		await Promise.all(
			tasks.map(async (task) => {
				const taskOrganization = tasksOrganization.createChild({
					title: task.name,
					identifier: createIdentifier(),
				});

				taskOrganization.addResource(this.mapper.mapTaskToResource(task, version));

				const filesMetadata = await this.filesMetadataClientAdapter.listFilesOfParent(task.id);
				const fileRecords = await Promise.all(
					filesMetadata.map((fileDto) => this.filesStorageClientAdapter.getFileRecord(fileDto.id))
				);

				await Promise.all(
					filesMetadata.map(async (fileMetadata, index) => {
						if (fileRecords[index].securityCheckStatus === FileRecordScanStatus.BLOCKED) {
							this.logger.info(
								new CommonCartridgeExportMessageLoggable(
									'A file was skipped because the securityCheckStatus is BLOCKED',
									{ fileId: fileMetadata.id, taskId: task.id }
								)
							);
							return;
						}

						const fileStream = await this.filesStorageClientAdapter.getStream(fileMetadata.id, fileMetadata.name);

						if (fileStream) {
							const resource = this.mapper.mapFileToResource(fileMetadata, fileStream);

							taskOrganization.addResource(resource);
						}
					})
				);
			})
		);
	}

	private async addColumnBoards(
		builder: CommonCartridgeFileBuilder,
		version: CommonCartridgeVersion,
		elements: BoardElementDto[],
		exportedColumnBoards: string[]
	): Promise<void> {
		const columnBoards = this.filterColumnBoardFromBoardElement(elements);
		const columnBoardsIds = columnBoards
			.filter((columnBoard) => exportedColumnBoards.includes(columnBoard.id))
			.map((columBoard) => columBoard.columnBoardId);
		const boardSkeletons: BoardResponse[] = await Promise.all(
			columnBoardsIds.map((columnBoardId) => this.boardClientAdapter.getBoardSkeletonById(columnBoardId))
		);

		await Promise.all(
			boardSkeletons.map(async (boardSkeleton) => {
				const columnBoardOrganization = builder.createOrganization({
					title: boardSkeleton.title,
					identifier: createIdentifier(boardSkeleton.id),
				});

				await Promise.all(
					boardSkeleton.columns.map((column) => this.addColumnToOrganization(column, version, columnBoardOrganization))
				);
			})
		);
	}

	private async addColumnToOrganization(
		column: ColumnResponse,
		version: CommonCartridgeVersion,
		columnBoardOrganization: CommonCartridgeOrganizationNode
	): Promise<void> {
		const columnOrganization = columnBoardOrganization.createChild({
			title: column.title ?? '',
			identifier: createIdentifier(column.id),
		});

		if (column.cards.length) {
			const cardsIds = column.cards.map((card) => card.cardId);
			const listOfCards: CardListResponseDto = await this.cardClientAdapter.getAllBoardCardsByIds(cardsIds);
			const sortedCards = this.sortCardsAfterRetrieval(cardsIds, listOfCards.data);

			await Promise.all(sortedCards.map((card) => this.addCardToOrganization(card, version, columnOrganization)));
		}
	}

	private sortCardsAfterRetrieval(cardsIds: string[], retrievedCards: CardResponseDto[]): CardResponseDto[] {
		const retrievedCardsById = new Map<string, CardResponseDto>();
		retrievedCards.forEach((retrievedCard) => retrievedCardsById.set(retrievedCard.id, retrievedCard));

		const sortedCards = cardsIds.map((id) => retrievedCardsById.get(id)).filter((element) => !!element);
		return sortedCards;
	}

	private async addCardToOrganization(
		card: CardResponseDto,
		version: CommonCartridgeVersion,
		columnOrganization: CommonCartridgeOrganizationNode
	): Promise<void> {
		const cardOrganization = columnOrganization.createChild({
			title: card.title ?? '',
			identifier: createIdentifier(card.id),
		});

		// INFO: for await keeps the order of files in cards in the correct order
		// with Promise.all, the order of files would be random
		for await (const cardElement of card.elements) {
			await this.addCardElementToOrganization(cardElement, version, cardOrganization);
		}
	}

	private async openStreamsToFiles(element: CardResponseElementsInnerDto): Promise<FileMetadataAndStream[]> {
		const fileMetadataBufferArray: FileMetadataAndStream[] = [];

		if (element.type === ContentElementType.FILE || element.type === ContentElementType.FILE_FOLDER) {
			const filesMetadata = await this.filesMetadataClientAdapter.listFilesOfParent(element.id);
			const fileRecords = await Promise.all(
				filesMetadata.map((fileDto) => this.filesStorageClientAdapter.getFileRecord(fileDto.id))
			);

			const streamPromises = filesMetadata.map(async (fileMetadata, index) => {
				if (fileRecords[index].securityCheckStatus === FileRecordScanStatus.BLOCKED) {
					this.logger.info(
						new CommonCartridgeExportMessageLoggable('A file was skipped because the securityCheckStatus is BLOCKED', {
							fileId: fileMetadata.id,
							elementId: element.id,
						})
					);
					return;
				}

				const file = await this.filesStorageClientAdapter.getStream(fileMetadata.id, fileMetadata.name);

				if (!file) {
					return undefined;
				}

				const fileMetadataAndStream: FileMetadataAndStream = {
					name: fileMetadata.name,
					file,
					fileDto: fileMetadata,
				};

				return fileMetadataAndStream;
			});

			const streamsOrUndefined = await Promise.all(streamPromises);
			const streams = streamsOrUndefined.filter((fileData) => !!fileData);
			fileMetadataBufferArray.push(...streams);
		}

		return fileMetadataBufferArray;
	}

	private async addCardElementToOrganization(
		element: CardResponseElementsInnerDto,
		version: CommonCartridgeVersion,
		cardOrganization: CommonCartridgeOrganizationNode
	): Promise<void> {
		switch (element.type) {
			case ContentElementType.RICH_TEXT:
				const resource = this.mapper.mapRichTextElementToResource(element as RichTextElementResponseDto);
				cardOrganization.addResource(resource);
				break;
			case ContentElementType.LINK:
				const linkResource = this.mapper.mapLinkElementToResource(element as LinkElementResponseDto);
				cardOrganization.addResource(linkResource);
				break;
			case ContentElementType.FILE:
				const metadataAndStreamsForFile = await this.openStreamsToFiles(element);

				for (const fileMetadata of metadataAndStreamsForFile) {
					const { file, fileDto } = fileMetadata;
					const fileResource = this.mapper.mapFileToResource(fileDto, file, element as FileElementResponseDto);
					cardOrganization.addResource(fileResource);
				}

				break;
			case ContentElementType.FILE_FOLDER:
				if (version !== CommonCartridgeVersion.V_1_3_0) {
					break;
				}
				const metadataAndStreamsForFolder = await this.openStreamsToFiles(element);
				const fileFolderResource = this.mapper.mapFileFolderToResource(
					element as FileFolderElementResponseDto,
					metadataAndStreamsForFolder
				);
				cardOrganization.addResource(fileFolderResource);

				break;
		}
	}

	private filterTasksFromBoardElements(elements: BoardElementDto[]): BoardTaskDto[] {
		const tasks = elements
			.filter((element) => element.type === BoardElementDtoType.TASK)
			.map((element) => element.content as BoardTaskDto);

		return tasks;
	}

	private filterLessonFromBoardElements(elements: BoardElementDto[]): BoardLessonDto[] {
		const lessons = elements
			.filter((element) => element.content instanceof BoardLessonDto)
			.map((element) => element.content as BoardLessonDto);

		return lessons;
	}

	private filterColumnBoardFromBoardElement(elements: BoardElementDto[]): BoardColumnBoardDto[] {
		const columnBoard = elements
			.filter((element) => element.type === BoardElementDtoType.COLUMN_BOARD)
			.map((element) => element.content as BoardColumnBoardDto);

		return columnBoard;
	}
}
