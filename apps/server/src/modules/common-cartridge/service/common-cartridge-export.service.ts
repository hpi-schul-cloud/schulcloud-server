import { FileDto, FilesStorageClientAdapterService } from '@modules/files-storage-client';
import { Injectable } from '@nestjs/common';
import { BoardClientAdapter, BoardSkeletonDto, ColumnSkeletonDto } from '../common-cartridge-client/board-client';
import { CourseCommonCartridgeMetadataDto, CoursesClientAdapter } from '../common-cartridge-client/course-client';
import { CourseRoomsClientAdapter } from '../common-cartridge-client/room-client';
import { RoomBoardDto } from '../common-cartridge-client/room-client/dto/room-board.dto';
import { CardClientAdapter } from '../common-cartridge-client/card-client/card-client.adapter';
import { CardListResponseDto } from '../common-cartridge-client/card-client/dto/card-list-response.dto';
import { LessonClientAdapter } from '../common-cartridge-client/lesson-client/lesson-client.adapter';
import { BoardColumnBoardDto } from '../common-cartridge-client/room-client/dto/board-column-board.dto';
import { BoardLessonDto } from '../common-cartridge-client/room-client/dto/board-lesson.dto';
import { LessonContentDto, LessonDto } from '../common-cartridge-client/lesson-client/dto';
import { CommonCartridgeFileBuilder } from '../export/builders/common-cartridge-file-builder';
import { CommonCartridgeVersion } from '../export/common-cartridge.enums';
import { CommonCartridgeExportMapper } from './common-cartridge.mapper';
import { CommonCartridgeOrganizationNode } from '../export/builders/common-cartridge-organization-node';
import { BoardTaskDto } from '../common-cartridge-client/room-client/dto/board-task.dto';
import { createIdentifier } from '../export/utils';
import { BoardElementDto } from '../common-cartridge-client/room-client/dto/board-element.dto';
import { BoardElementDtoType } from '../common-cartridge-client/room-client/enums/board-element.enum';
import { CardResponseDto } from '../common-cartridge-client/card-client/dto/card-response.dto';
import { CardResponseElementsInnerDto } from '../common-cartridge-client/card-client/types/card-response-elements-inner.type';
import { RichTextElementResponseDto } from '../common-cartridge-client/card-client/dto/rich-text-element-response.dto';
import { LinkElementResponseDto } from '../common-cartridge-client/card-client/dto/link-element-response.dto';

export const isRichTextElement = (reference: unknown): reference is RichTextElementResponseDto =>
	reference instanceof RichTextElementResponseDto;

export const isLinkElement = (reference: unknown): reference is LinkElementResponseDto =>
	reference instanceof LinkElementResponseDto;

@Injectable()
export class CommonCartridgeExportService {
	constructor(
		private readonly filesService: FilesStorageClientAdapterService,
		private readonly boardClientAdapter: BoardClientAdapter,
		private readonly cardClientAdapter: CardClientAdapter,
		private readonly coursesClientAdapter: CoursesClientAdapter,
		private readonly courseRoomsClientAdapter: CourseRoomsClientAdapter,
		private readonly lessonClinetAdapter: LessonClientAdapter,
		private readonly mapper: CommonCartridgeExportMapper
	) {}

	public async exportCourse(courseId: string, version: CommonCartridgeVersion): Promise<Buffer> {
		const builder = new CommonCartridgeFileBuilder(this.mapper.mapCourseToManifestNew(version, courseId));

		const courseCommonCartridgeMetadata: CourseCommonCartridgeMetadataDto =
			await this.findCourseCommonCartridgeMetadata(courseId);

		builder.addMetadata(this.mapper.mapCourseToMetadata(courseCommonCartridgeMetadata));

		// get room board and the structure of the course
		const roomBoard: RoomBoardDto = await this.findRoomBoardByCourseId(courseId);

		// add lessons to organization
		await this.addLessons(builder, version, roomBoard.elements);

		// add tasks to organization
		this.addTasks(builder, version, roomBoard.elements);

		// add column boards and cards to organization
		await this.addColumnBoards(builder, roomBoard.elements);

		return builder.build();
	}

	public async findCourseFileRecords(courseId: string): Promise<FileDto[]> {
		const courseFiles = await this.filesService.listFilesOfParent(courseId);

		return courseFiles;
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
		elements: BoardElementDto[]
	): Promise<void> {
		// get lessons ids from room board
		const filteredLessons = this.filterLessonFromBoardElements(elements);
		const lessonsIds = filteredLessons.map((lesson) => lesson.id);

		// get lessons and lesson's linked tasks from the server
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

	private addTasks(
		builder: CommonCartridgeFileBuilder,
		version: CommonCartridgeVersion,
		elements: BoardElementDto[]
	): void {
		if (!elements) {
			return;
		}

		const tasks: BoardTaskDto[] = this.filterTasksFromBoardElements(elements);

		const tasksOrganization = builder.createOrganization({
			title: 'Aufgaben',
			identifier: createIdentifier(),
		});

		tasks.forEach((task) => {
			tasksOrganization.addResource(this.mapper.mapTaskToResource(task, version));
		});
	}

	private async addColumnBoards(builder: CommonCartridgeFileBuilder, elements: BoardElementDto[]): Promise<void> {
		const columnBoards = this.filterColumnBoardFromBoardElement(elements);
		const columnBoardsIds = columnBoards.map((element) => element.columnBoardId);

		// get board skeleton of columnm boards from the server
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

		// get cards ids by every column
		const cardsIds = column.cards.map((card) => card.cardId);
		const listOfCards: CardListResponseDto = await this.findAllCardsByIds(cardsIds);

		listOfCards.data.forEach((card) => {
			this.addCardToOrganization(card, columnOrganization);
		});
	}

	private addCardToOrganization(card: CardResponseDto, columnOrganization: CommonCartridgeOrganizationNode): void {
		const cardOrganization = columnOrganization.createChild({
			title: card.title ?? '',
			identifier: createIdentifier(card.id),
		});

		card.elements.forEach((element) => {
			this.addCardElementToOrganization(element, cardOrganization);
		});
	}

	private addCardElementToOrganization(
		element: CardResponseElementsInnerDto,
		cardOrganization: CommonCartridgeOrganizationNode
	): void {
		if (isRichTextElement(element)) {
			const resource = this.mapper.mapRichTextElementToResource(element);

			cardOrganization.addResource(resource);
		}

		if (isLinkElement(element)) {
			const resource = this.mapper.mapLinkElementToResource(element);

			cardOrganization.addResource(resource);
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
}
