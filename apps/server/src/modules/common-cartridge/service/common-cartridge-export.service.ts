import { FileDto, FilesStorageClientAdapterService } from '@modules/files-storage-client';
import { Injectable } from '@nestjs/common';
import { BoardClientAdapter, BoardSkeletonDto } from '../common-cartridge-client/board-client';
import { CourseCommonCartridgeMetadataDto, CoursesClientAdapter } from '../common-cartridge-client/course-client';
import { CourseRoomsClientAdapter } from '../common-cartridge-client/room-client';
import { RoomBoardDto } from '../common-cartridge-client/room-client/dto/room-board.dto';
import { CardClientAdapter } from '../common-cartridge-client/card-client/card-client.adapter';
import { CardListResponseDto } from '../common-cartridge-client/card-client/dto/card-list-response.dto';
import { ExportedCourse } from '../dto/exported-course.dto';
import { LessonClientAdapter } from '../common-cartridge-client/lesson-client/lesson-client.adapter';
import { BoardColumnBoardDto } from '../common-cartridge-client/room-client/dto/board-column-board.dto';
import { BoardLessonDto } from '../common-cartridge-client/room-client/dto/board-lesson.dto';
import { LessonDto } from '../common-cartridge-client/lesson-client/dto';

@Injectable()
export class CommonCartridgeExportService {
	constructor(
		private readonly filesService: FilesStorageClientAdapterService,
		private readonly boardClientAdapter: BoardClientAdapter,
		private readonly cardClientAdapter: CardClientAdapter,
		private readonly coursesClientAdapter: CoursesClientAdapter,
		private readonly courseRoomsClientAdapter: CourseRoomsClientAdapter,
		private readonly lessonClinetAdapter: LessonClientAdapter
	) {}

	public async exportCourse(courseId: string): Promise<ExportedCourse> {
		const courseCommonCartridgeMetadata: CourseCommonCartridgeMetadataDto =
			await this.findCourseCommonCartridgeMetadata(courseId);

		// get room board
		const roomBoard: RoomBoardDto = await this.findRoomBoardByCourseId(courseId);

		// get lessons ids
		const lessonsIds = roomBoard.elements
			.filter((element) => element.content instanceof BoardLessonDto)
			.map((element) => element.content.id);

		// get lessons and lesson tasks
		const lessons = await Promise.all(lessonsIds.map((elementId) => this.findLessonById(elementId)));

		// get column boards ids
		const columnBoardsIds = roomBoard.elements
			.filter((element) => element.content instanceof BoardColumnBoardDto)
			.map((element) => element.content.id);

		// get board skeleton of columnm boards
		const boardSkeleton: BoardSkeletonDto[] = await Promise.all(
			columnBoardsIds.map((elementId) => this.findBoardSkeletonById(elementId))
		);

		// get cards ids
		const columnsOfBoardSkeleton = boardSkeleton.map((board) => board.columns);
		const cardsOfColumns = columnsOfBoardSkeleton.map((columns) => columns.map((column) => column.cards));
		const cardsIds = cardsOfColumns.flat(2).map((card) => card.cardId);

		// get cards
		const cards = await this.findAllCardsByIds(cardsIds);

		// export course to common cartridge
		const exportedCourse: ExportedCourse = {
			metadata: courseCommonCartridgeMetadata,
			board: boardSkeleton,
			roomBoard,
			cards,
			lessons,
		};

		return exportedCourse;
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
}
