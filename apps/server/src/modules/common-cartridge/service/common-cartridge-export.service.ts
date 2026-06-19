import { Logger } from '@core/logger';
import { JwtPayload } from '@infra/auth-guard';
import {
	BoardColumnBoardResponse,
	BoardElementResponseType,
	BoardLessonResponse,
	BoardsClientAdapter,
	BoardTaskResponse,
	CardClientAdapter,
	CardResponse,
	CardResponseElementsInner,
	ColumnResponse,
	ContentElementType,
	CourseRoomsClientAdapter,
	CoursesClientAdapter,
	FileElementResponse,
	FileFolderElementResponse,
	FileRecordParentType,
	FileRecordResponse,
	FileRecordScanStatus,
	FilesStorageClientAdapter,
	LessonClientAdapter,
	LessonContentResponse,
	LinkElementResponse,
	RichTextElementResponse,
	StorageLocation,
} from '@infra/common-cartridge-clients';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import archiver from 'archiver';
import jwt from 'jsonwebtoken';
import { Stream } from 'node:stream';
import { CommonCartridgeFileBuilder } from '../export/builders/common-cartridge-file-builder';
import { CommonCartridgeOrganizationNode } from '../export/builders/common-cartridge-organization-node';
import { CommonCartridgeVersion } from '../export/common-cartridge.enums';
import { createIdentifier } from '../export/utils';
import { CommonCartridgeMessageLoggable } from '../loggable/common-cartridge-message.loggable';
import { CommonCartridgeExportMapper } from './common-cartridge-export.mapper';
import { CommonCartridgeExportResponse } from './common-cartridge-export.response';

export type FileMetadataAndStream = { name: string; file: Stream; fileDto: FileRecordResponse };

@Injectable()
export class CommonCartridgeExportService {
	constructor(
		private readonly boardClientAdapter: BoardsClientAdapter,
		private readonly cardClientAdapter: CardClientAdapter,
		private readonly coursesClientAdapter: CoursesClientAdapter,
		private readonly courseRoomsClientAdapter: CourseRoomsClientAdapter,
		private readonly lessonClientAdapter: LessonClientAdapter,
		private readonly filesStorageClientAdapter: FilesStorageClientAdapter,
		private readonly mapper: CommonCartridgeExportMapper,
		private readonly logger: Logger
	) {
		this.logger.setContext(CommonCartridgeExportService.name);
	}

	public async exportCourse(
		jwt: string,
		courseId: string,
		version: CommonCartridgeVersion,
		exportedTopics: string[],
		exportedTasks: string[],
		exportedColumnBoards: string[]
	): Promise<CommonCartridgeExportResponse> {
		this.logger.debug(new CommonCartridgeMessageLoggable('New Common-Cartridge export started', { courseId, version }));

		const archive = this.createArchiver(courseId);
		const builder = new CommonCartridgeFileBuilder(
			this.mapper.mapCourseToManifest(version, courseId),
			archive,
			this.logger
		);

		const courseCommonCartridgeMetadata = await this.coursesClientAdapter.getCourseCommonCartridgeMetadata(
			jwt,
			courseId
		);
		this.logger.debug(new CommonCartridgeMessageLoggable('Loaded course metadata', { courseId }));

		builder.addMetadata(this.mapper.mapCourseToMetadata(courseCommonCartridgeMetadata));

		// get room board and the structure of the course
		const roomBoard = await this.courseRoomsClientAdapter.getRoomBoardByCourseId(jwt, courseId);
		this.logger.debug(new CommonCartridgeMessageLoggable('Loaded roomboard of course', { courseId }));

		// add elements in dashboard order
		const exportedTopicIds = new Set(exportedTopics);

		const exportedTaskIds = new Set(exportedTasks);

		const exportedColumnBoardIds = new Set(exportedColumnBoards);



					if (exportedTopicIds.has(lesson.id)) {
			switch (element.type) {
				case BoardElementResponseType.LESSON: {
					const lesson = element.content as BoardLessonResponse;
					if (exportedTopics.includes(lesson.id)) {
						await this.addLesson(jwt, builder, version, lesson.id);
					}
					break;
				}
				case BoardElementResponseType.TASK: {
					const task = element.content as BoardTaskResponse;
					if (exportedTasks.includes(task.id)) {
						await this.addTask(jwt, builder, version, task);
					}
					break;
				}
				case BoardElementResponseType.COLUMN_BOARD: {
					const columnBoard = element.content as BoardColumnBoardResponse;
					if (exportedColumnBoards.includes(columnBoard.id)) {
						await this.addColumnBoard(jwt, builder, version, columnBoard);
					}
					break;
				}
			}
		}
		this.logger.debug(new CommonCartridgeMessageLoggable('Added all elements of course', { courseId }));

		builder.build();
		this.logger.debug(new CommonCartridgeMessageLoggable('Built archive', { courseId }));

		const response: CommonCartridgeExportResponse = {
			data: builder.archive,
			name: `${roomBoard.title}-${new Date().toISOString()}.imscc`,
		};

		this.logger.debug(new CommonCartridgeMessageLoggable('Finished export of course', { courseId }));

		return response;
	}

	private createArchiver(courseId: string): archiver.Archiver {
		const archive = archiver('zip');

		archive.on('warning', (err) => {
			this.logger.warning(
				new CommonCartridgeMessageLoggable('Warning while creating archive', {
					courseId,
					cause: JSON.stringify(err),
				})
			);
		});

		archive.on('progress', (progress) => {
			this.logger.debug(
				new CommonCartridgeMessageLoggable(
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
				new CommonCartridgeMessageLoggable(`Archive closed. Length: ${archive.pointer()}`, { courseId })
			);
		});

		return archive;
	}

	private addComponentToOrganization(
		component: LessonContentResponse,
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

	private async addLesson(
		jwt: string,
		builder: CommonCartridgeFileBuilder,
		version: CommonCartridgeVersion,
		lessonId: string
	): Promise<void> {
		const [lesson, linkedTasks] = await Promise.all([
			this.lessonClientAdapter.getLessonById(jwt, lessonId),
			this.lessonClientAdapter.getLessonTasks(jwt, lessonId),
		]);
		const lessonWithTasks = { ...lesson, linkedTasks };

		const lessonOrganization = builder.createOrganization(this.mapper.mapLessonToOrganization(lessonWithTasks));

		lessonWithTasks.contents.forEach((content) => {
			this.addComponentToOrganization(content, lessonOrganization);
		});

		lessonWithTasks.linkedTasks.forEach((task) => {
			lessonOrganization.addResource(this.mapper.mapLinkedTaskToResource(task, version));
		});
	}

	private async addTask(
		jwt: string,
		builder: CommonCartridgeFileBuilder,
		version: CommonCartridgeVersion,
		task: BoardTaskResponse
	): Promise<void> {
		const taskOrganization = builder.createOrganization({
			title: task.name,
			identifier: createIdentifier(),
		});

		taskOrganization.addResource(this.mapper.mapTaskToResource(task, version));

		const { schoolId } = this.getJwtPayload(jwt);
		const fileRecords = await this.filesStorageClientAdapter.list(
			jwt,
			schoolId,
			StorageLocation.SCHOOL,
			task.id,
			FileRecordParentType.TASKS
		);

		await Promise.all(
			fileRecords.map(async (fileRecord) => {
				if (fileRecord.securityCheckStatus === FileRecordScanStatus.BLOCKED) {
					this.logger.info(
						new CommonCartridgeMessageLoggable('A file was skipped because the securityCheckStatus is BLOCKED', {
							fileId: fileRecord.id,
							taskId: task.id,
						})
					);
					return;
				}

				const fileStream = await this.filesStorageClientAdapter.getStream(jwt, fileRecord.id, fileRecord.name);

				if (fileStream) {
					const resource = this.mapper.mapFileToResource(fileRecord, fileStream);

					taskOrganization.addResource(resource);
				}
			})
		);
	}

	private async addColumnBoard(
		jwt: string,
		builder: CommonCartridgeFileBuilder,
		version: CommonCartridgeVersion,
		columnBoard: BoardColumnBoardResponse
	): Promise<void> {
		const boardSkeleton = await this.boardClientAdapter.getBoardSkeletonById(jwt, columnBoard.columnBoardId);

		const columnBoardOrganization = builder.createOrganization({
			title: boardSkeleton.title,
			identifier: createIdentifier(boardSkeleton.id),
		});

		await Promise.all(
			boardSkeleton.columns.map((column) => this.addColumnToOrganization(jwt, column, version, columnBoardOrganization))
		);
	}

	private async addColumnToOrganization(
		jwt: string,
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
			const listOfCards = await this.cardClientAdapter.getAllBoardCardsByIds(jwt, cardsIds);
			const sortedCards = this.sortCardsAfterRetrieval(cardsIds, listOfCards.data);

			await Promise.all(sortedCards.map((card) => this.addCardToOrganization(jwt, card, version, columnOrganization)));
		}
	}

	private sortCardsAfterRetrieval(cardsIds: string[], retrievedCards: CardResponse[]): CardResponse[] {
		const retrievedCardsById = new Map<string, CardResponse>();
		retrievedCards.forEach((retrievedCard) => retrievedCardsById.set(retrievedCard.id, retrievedCard));

		const sortedCards = cardsIds.map((id) => retrievedCardsById.get(id)).filter((element) => !!element);
		return sortedCards;
	}

	private async addCardToOrganization(
		jwt: string,
		card: CardResponse,
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
			await this.addCardElementToOrganization(jwt, cardElement, version, cardOrganization);
		}
	}

	private async openStreamsToFiles(jwt: string, element: CardResponseElementsInner): Promise<FileMetadataAndStream[]> {
		const fileMetadataBufferArray: FileMetadataAndStream[] = [];

		if (element.type === ContentElementType.FILE || element.type === ContentElementType.FILE_FOLDER) {
			const { schoolId } = this.getJwtPayload(jwt);
			const fileRecords = await this.filesStorageClientAdapter.list(
				jwt,
				schoolId,
				StorageLocation.SCHOOL,
				element.id,
				FileRecordParentType.BOARDNODES
			);

			const streamPromises = fileRecords.map(async (fileRecord) => {
				if (fileRecord.securityCheckStatus === FileRecordScanStatus.BLOCKED) {
					this.logger.info(
						new CommonCartridgeMessageLoggable('A file was skipped because the securityCheckStatus is BLOCKED', {
							fileId: fileRecord.id,
							elementId: element.id,
						})
					);
					return;
				}

				const file = await this.filesStorageClientAdapter.getStream(jwt, fileRecord.id, fileRecord.name);

				if (!file) {
					return undefined;
				}

				const fileMetadataAndStream: FileMetadataAndStream = {
					name: fileRecord.name,
					file,
					fileDto: fileRecord,
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
		jwt: string,
		element: CardResponseElementsInner,
		version: CommonCartridgeVersion,
		cardOrganization: CommonCartridgeOrganizationNode
	): Promise<void> {
		switch (element.type) {
			case ContentElementType.RICH_TEXT:
				const resource = this.mapper.mapRichTextElementToResource(element as RichTextElementResponse);
				cardOrganization.addResource(resource);
				break;
			case ContentElementType.LINK:
				const linkResource = this.mapper.mapLinkElementToResource(element as LinkElementResponse);
				cardOrganization.addResource(linkResource);
				break;
			case ContentElementType.FILE:
				const metadataAndStreamsForFile = await this.openStreamsToFiles(jwt, element);

				for (const fileMetadata of metadataAndStreamsForFile) {
					const { file, fileDto } = fileMetadata;
					const fileResource = this.mapper.mapFileToResource(fileDto, file, element as FileElementResponse);
					cardOrganization.addResource(fileResource);
				}

				break;
			case ContentElementType.FILE_FOLDER:
				const metadataAndStreamsForFolder = await this.openStreamsToFiles(jwt, element);

				const fileFolderElement = element as FileFolderElementResponse;
				if (version === CommonCartridgeVersion.V_1_3_0) {
					this.addFileFolderForCc13ToOrg(cardOrganization, fileFolderElement, metadataAndStreamsForFolder);
				} else if (version === CommonCartridgeVersion.V_1_1_0) {
					this.addFileFolderForCc11ToOrg(cardOrganization, fileFolderElement, metadataAndStreamsForFolder);
				}

				break;
		}
	}

	private addFileFolderForCc13ToOrg(
		org: CommonCartridgeOrganizationNode,
		element: FileFolderElementResponse,
		metadataAndStreamsForFolder: FileMetadataAndStream[]
	): void {
		const fileFolderResource = this.mapper.mapFileFolderToResource(element, metadataAndStreamsForFolder);
		org.addResource(fileFolderResource);
	}

	private addFileFolderForCc11ToOrg(
		org: CommonCartridgeOrganizationNode,
		element: FileFolderElementResponse,
		metadataAndStreamsForFolder: FileMetadataAndStream[]
	): void {
		const fileFolderOrg = org.createChild({
			identifier: createIdentifier(element.id),
			title: element.content.title,
		});

		for (const fileMetadata of metadataAndStreamsForFolder) {
			const { file, fileDto } = fileMetadata;
			const fileResource = this.mapper.mapFileToResource(fileDto, file);
			fileFolderOrg.addResource(fileResource);
		}
	}

	private getJwtPayload(jwtToken: string): JwtPayload {
		const decodedJwt = jwt.decode(jwtToken, { json: true }) as JwtPayload;

		return decodedJwt;
	}
}
