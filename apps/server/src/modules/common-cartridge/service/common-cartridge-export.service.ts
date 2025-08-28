import { Injectable } from '@nestjs/common';
import { LegacyLogger } from '@core/logger';
import { CoursesClientAdapter } from '@infra/courses-client';
import { FilesStorageClientAdapter } from '@infra/files-storage-client';
import { FileDto, FilesStorageClientAdapterService } from '@modules/files-storage-client';
import { BoardResponse, BoardsClientAdapter, ColumnResponse } from '@infra/boards-client';
import { CardClientAdapter } from '../common-cartridge-client/card-client';
import { CourseRoomsClientAdapter } from '../common-cartridge-client/room-client';
import { LessonClientAdapter } from '../common-cartridge-client/lesson-client';
import { CommonCartridgeExportMapper } from './common-cartridge-export.mapper';
import { CommonCartridgeVersion } from '../export/common-cartridge.enums';
import { CommonCartridgeFileBuilder } from '../export/builders/common-cartridge-file-builder';
import { LessonContentDto } from '../common-cartridge-client/lesson-client/dto';
import { CommonCartridgeOrganizationNode } from '../export/builders/common-cartridge-organization-node';
import {
	BoardColumnBoardDto,
	BoardElementDto,
	BoardLessonDto,
	BoardTaskDto,
} from '../common-cartridge-client/room-client/dto';
import { createIdentifier } from '../export/utils';
import { BoardElementDtoType } from '../common-cartridge-client/room-client/enums/board-element.enum';
import { CardResponseElementsInnerDto } from '../common-cartridge-client/card-client/types/card-response-elements-inner.type';
import {
	CardListResponseDto,
	CardResponseDto,
	RichTextElementResponseDto,
	LinkElementResponseDto,
	FileElementResponseDto,
} from '../common-cartridge-client/card-client/dto';
import { ContentElementType } from '../common-cartridge-client/card-client/enums/content-element-type.enum';

type FileMetadataBuffer = { id: string; name: string; fileBuffer: Buffer; fileDto: FileDto };

@Injectable()
export class CommonCartridgeExportService {
	constructor(
		private readonly logger: LegacyLogger,
		private readonly boardClientAdapter: BoardsClientAdapter,
		private readonly cardClientAdapter: CardClientAdapter,
		private readonly coursesClientAdapter: CoursesClientAdapter,
		private readonly courseRoomsClientAdapter: CourseRoomsClientAdapter,
		private readonly lessonClientAdapter: LessonClientAdapter,
		private readonly filesMetadataClientAdapter: FilesStorageClientAdapterService,
		private readonly filesStorageClientAdapter: FilesStorageClientAdapter,
		private readonly mapper: CommonCartridgeExportMapper
	) {}

	public async exportCourse(
		courseId: string,
		version: CommonCartridgeVersion,
		exportedTopics: string[],
		exportedTasks: string[],
		exportedColumnBoards: string[]
	): Promise<Buffer> {
		const builder = new CommonCartridgeFileBuilder(this.mapper.mapCourseToManifest(version, courseId));
		this.logger.log(CommonCartridgeExportService.name + `: Start Exporting course ${courseId} ...`);
		const courseCommonCartridgeMetadata = await this.coursesClientAdapter.getCourseCommonCartridgeMetadata(courseId);

		builder.addMetadata(this.mapper.mapCourseToMetadata(courseCommonCartridgeMetadata));

		// get room board and the structure of the course
		const roomBoard = await this.courseRoomsClientAdapter.getRoomBoardByCourseId(courseId);

		// add lessons to organization
		await this.addLessons(builder, version, roomBoard.elements, exportedTopics);

		// add tasks to organization
		await this.addTasks(builder, version, roomBoard.elements, exportedTasks);

		// add column boards and cards to organization
		await this.addColumnBoards(builder, roomBoard.elements, exportedColumnBoards);
		this.logger.log(CommonCartridgeExportService.name + `: Start building CC File...`);
		return builder.build();
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

				await Promise.all(
					filesMetadata.map(async (fileMetadata) => {
						const file = await this.filesStorageClientAdapter.download(fileMetadata.id, fileMetadata.name);

						if (file) {
							const resource = this.mapper.mapFileToResource(fileMetadata, file);

							taskOrganization.addResource(resource);
						}
					})
				);
			})
		);
	}

	private async addColumnBoards(
		builder: CommonCartridgeFileBuilder,
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
				this.logger.log(CommonCartridgeExportService.name + `: adding columns of board to organization...`);
				await Promise.all(
					boardSkeleton.columns.map((column) => this.addColumnToOrganization(column, columnBoardOrganization))
				);
				this.logger.log(CommonCartridgeExportService.name + `: adding columns of board to organization... done.`);
			})
		);
	}

	private async addColumnToOrganization(
		column: ColumnResponse,
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
			this.logger.log(
				CommonCartridgeExportService.name + `: adding cards of column ${column.title} to organization...`
			);
			await Promise.all(sortedCards.map((card) => this.addCardToOrganization(card, columnOrganization)));
			this.logger.log(
				CommonCartridgeExportService.name + `: adding cards of column ${column.title} to organization... done.`
			);
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
		columnOrganization: CommonCartridgeOrganizationNode
	): Promise<void> {
		const cardOrganization = columnOrganization.createChild({
			title: card.title ?? '',
			identifier: createIdentifier(card.id),
		});
		const fileMetadataBufferArray = await Promise.all(
			card.elements.map((element) => this.downloadAndStoreFiles(element))
		).then((array) => array.flat());
		this.logger.log(CommonCartridgeExportService.name + `: adding card ${card.id} to organization...`);
		await Promise.all(
			card.elements.map((element) =>
				this.addCardElementToOrganization(element, cardOrganization, fileMetadataBufferArray)
			)
		);
		this.logger.log(CommonCartridgeExportService.name + `: adding card ${card.id} to organization... done.`);
	}

	private async downloadAndStoreFiles(element: CardResponseElementsInnerDto): Promise<FileMetadataBuffer[]> {
		const fileMetadataBufferArray: FileMetadataBuffer[] = [];

		if (element.type === ContentElementType.FILE) {
			const filesMetadata = await this.filesMetadataClientAdapter.listFilesOfParent(element.id);

			for (const fileMetadata of filesMetadata) {
				this.logger.log(
					CommonCartridgeExportService.name + `: Downloading file ${fileMetadata.name} (${fileMetadata.id})...`
				);
				const file = await this.filesStorageClientAdapter.download(fileMetadata.id, fileMetadata.name);
				this.logger.log(
					CommonCartridgeExportService.name + `: Downloading file ${fileMetadata.name} (${fileMetadata.id})... done.`
				);

				if (file) {
					this.logger.log(
						CommonCartridgeExportService.name +
							`: push file ${fileMetadata.name} (${fileMetadata.id})  in fileMetadataBufferArray...`
					);
					fileMetadataBufferArray.push({
						id: element.id,
						name: fileMetadata.name,
						fileBuffer: file,
						fileDto: fileMetadata,
					});
					this.logger.log(
						CommonCartridgeExportService.name +
							`: push file ${fileMetadata.name} (${fileMetadata.id})  in fileMetadataBufferArray... done.`
					);
				}
			}
		}
		return fileMetadataBufferArray;
	}

	private addCardElementToOrganization(
		element: CardResponseElementsInnerDto,
		cardOrganization: CommonCartridgeOrganizationNode,
		fileMetadataBufferArray: FileMetadataBuffer[]
	): void {
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
				for (const fileMetadata of fileMetadataBufferArray) {
					const { id, fileBuffer, fileDto } = fileMetadata;

					if (fileBuffer && element.id === id) {
						const fileResource = this.mapper.mapFileToResource(fileDto, fileBuffer, element as FileElementResponseDto);

						cardOrganization.addResource(fileResource);
					}
				}
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
