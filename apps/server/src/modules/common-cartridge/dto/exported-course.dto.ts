import { BoardSkeletonDto } from '../common-cartridge-client/board-client';
import { CardListResponseDto } from '../common-cartridge-client/card-client/dto/card-list-response.dto';
import { CourseCommonCartridgeMetadataDto } from '../common-cartridge-client/course-client';
import { LessonDto, LessonLinkedTaskDto } from '../common-cartridge-client/lesson-client/dto';
import { RoomBoardDto } from '../common-cartridge-client/room-client/dto/room-board.dto';

export class ExportedCourse {
	metadata: CourseCommonCartridgeMetadataDto;

	board: BoardSkeletonDto[];

	roomBoard: RoomBoardDto;

	cards: CardListResponseDto;

	lessons: LessonDto[];

    linkedTasks: LessonLinkedTaskDto[];

	constructor(props: ExportedCourse) {
		this.metadata = props.metadata;
		this.board = props.board;
		this.roomBoard = props.roomBoard;
		this.cards = props.cards;
		this.lessons = props.lessons;
        this.linkedTasks = props.linkedTasks;
	}
}
