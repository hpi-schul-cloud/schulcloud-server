import { Injectable } from '@nestjs/common';
import { CoursesClientAdapter } from '@infra/courses-client';
import { CourseCommonCartridgeMetadataDto } from '@infra/courses-client/dto';
import { BoardClientAdapter, BoardSkeletonDto, ColumnSkeletonDto } from '../common-cartridge-client/board-client';
import { CardClientAdapter } from '../common-cartridge-client/card-client';
import { CourseRoomsClientAdapter } from '../common-cartridge-client/room-client';
import { LessonClientAdapter } from '../common-cartridge-client/lesson-client';
import { CommonCartridgeExportMapper } from './common-cartridge.mapper';
import { CommonCartridgeVersion } from '../export/common-cartridge.enums';
import { CommonCartridgeFileBuilder } from '../export/builders/common-cartridge-file-builder';
import { LessonContentDto, LessonDto } from '../common-cartridge-client/lesson-client/dto';
import { CommonCartridgeOrganizationNode } from '../export/builders/common-cartridge-organization-node';
import {
	BoardColumnBoardDto,
	BoardElementDto,
	BoardLessonDto,
	BoardTaskDto,
	RoomBoardDto,
} from '../common-cartridge-client/room-client/dto';
import {
	CardListResponseDto,
	CardResponseDto,
	RichTextElementResponseDto,
	LinkElementResponseDto,
} from '../common-cartridge-client/card-client/dto';
import { CardResponseElementsInnerDto } from '../common-cartridge-client/card-client/types/card-response-elements-inner.type';
import { BoardElementDtoType } from '../common-cartridge-client/room-client/enums/board-element.enum';
import { createIdentifier } from '../export/utils';

@Injectable()
export class CommonCartridgeExportService {
	constructor(
		private readonly boardClientAdapter: BoardClientAdapter,
		private readonly cardClientAdapter: CardClientAdapter,
		private readonly coursesClientAdapter: CoursesClientAdapter,
		private readonly courseRoomsClientAdapter: CourseRoomsClientAdapter,
		private readonly lessonClientAdapter: LessonClientAdapter,
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

		const courseCommonCartridgeMetadata = await this.findCourseCommonCartridgeMetadata(courseId);

		builder.addMetadata(this.mapper.mapCourseToMetadata(courseCommonCartridgeMetadata));

		// get room board and the structure of the course
		const roomBoard = await this.findRoomBoardByCourseId(courseId);

		// add lessons to organization
		await this.addLessons(builder, version, roomBoard.elements, exportedTopics);

		// add tasks to organization
		this.addTasks(builder, version, roomBoard.elements, exportedTasks);

		// add column boards and cards to organization
		await this.addColumnBoards(builder, roomBoard.elements, exportedColumnBoards);

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
		const lessons = await Promise.all(lessonsIds.map((elementId) => this.findLessonById(elementId)));

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

	private addTasks(
		builder: CommonCartridgeFileBuilder,
		version: CommonCartridgeVersion,
		elements: BoardElementDto[],
		exportedTasks: string[]
	): void {
		const tasks: BoardTaskDto[] = this.filterTasksFromBoardElements(elements).filter((task) =>
			exportedTasks.includes(task.id)
		);
		const tasksOrganization = builder.createOrganization({
			title: 'Aufgaben',
			identifier: createIdentifier(),
		});

		tasks.forEach((task) => {
			tasksOrganization.addResource(this.mapper.mapTaskToResource(task, version));
		});
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
		const boardSkeletons: BoardSkeletonDto[] = await Promise.all(
			columnBoardsIds.map((columnBoardId) => this.findBoardSkeletonById(columnBoardId))
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

		if (column.cards.length) {
			const cardsIds = column.cards.map((card) => card.cardId);
			const listOfCards: CardListResponseDto = await this.findAllCardsByIds(cardsIds);

			listOfCards.data.forEach((card) => {
				this.addCardToOrganization(card, columnOrganization);
			});
		}
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
		if (RichTextElementResponseDto.isRichTextElement(element)) {
			const resource = this.mapper.mapRichTextElementToResource(element);

			cardOrganization.addResource(resource);
		}

		if (LinkElementResponseDto.isLinkElement(element)) {
			const resource = this.mapper.mapLinkElementToResource(element);

			cardOrganization.addResource(resource);
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

	private async findCourseCommonCartridgeMetadata(courseId: string): Promise<CourseCommonCartridgeMetadataDto> {
		const courseMetadata = await this.coursesClientAdapter.getCourseCommonCartridgeMetadata(courseId);
		const dto = new CourseCommonCartridgeMetadataDto(courseMetadata);

		return dto;
	}

	private async findRoomBoardByCourseId(courseId: string): Promise<RoomBoardDto> {
		const roomBoardDto = await this.courseRoomsClientAdapter.getRoomBoardByCourseId(courseId);

		return roomBoardDto;
	}

	private async findBoardSkeletonById(boardId: string): Promise<BoardSkeletonDto> {
		const boardSkeletonDto = await this.boardClientAdapter.getBoardSkeletonById(boardId);

		return boardSkeletonDto;
	}

	private async findAllCardsByIds(ids: Array<string>): Promise<CardListResponseDto> {
		const cardListResponseDto = await this.cardClientAdapter.getAllBoardCardsByIds(ids);

		return cardListResponseDto;
	}

	private async findLessonById(lessonId: string): Promise<LessonDto> {
		const lessonDto = await this.lessonClientAdapter.getLessonById(lessonId);

		return lessonDto;
	}
}
