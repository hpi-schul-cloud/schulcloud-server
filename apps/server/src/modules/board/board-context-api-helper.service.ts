import { BoardExternalReference, BoardExternalReferenceType, BoardNodeService, ColumnBoard } from '@modules/board';
import { CourseService } from '@modules/learnroom';
import { RoomService } from '@modules/room';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';

@Injectable()
export class BoardContextApiHelperService {
	constructor(
		private readonly courseService: CourseService,
		private readonly roomService: RoomService,
		private readonly boardNodeService: BoardNodeService
	) {}

	public async getSchoolIdForBoardNode(nodeId: EntityId): Promise<EntityId> {
		const boardNode = await this.boardNodeService.findById(nodeId);
		const board = await this.boardNodeService.findRoot(boardNode);
		const columnBoard = await this.boardNodeService.findByClassAndId(ColumnBoard, board.id);
		const schoolId = await this.getSchoolIdForBoard(columnBoard.context);
		return schoolId;
	}

	private async getSchoolIdForBoard(context: BoardExternalReference): Promise<EntityId> {
		if (context.type === BoardExternalReferenceType.Course) {
			const course = await this.courseService.findById(context.id);

			return course.school.id;
		}

		if (context.type === BoardExternalReferenceType.Room) {
			const room = await this.roomService.getSingleRoom(context.id);

			return room.schoolId;
		}
		/* istanbul ignore next */
		throw new Error(`Unsupported board reference type ${context.type as string}`);
	}
}
