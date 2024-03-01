import { ForbiddenException, Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { BoardRepo, CourseRepo, UserRepo } from '@shared/repo';
import { ColumnboardBoardElement, ColumnBoardTarget } from '@shared/domain/entity';
import { RoomsService } from '../service/rooms.service';
import { RoomBoardDTO } from '../types';
import { RoomBoardDTOFactory } from './room-board-dto.factory';
import { RoomsAuthorisationService } from './rooms.authorisation.service';

@Injectable()
export class RoomsUc {
	constructor(
		private readonly courseRepo: CourseRepo,
		private readonly userRepo: UserRepo,
		private readonly boardRepo: BoardRepo,
		private readonly factory: RoomBoardDTOFactory,
		private readonly authorisationService: RoomsAuthorisationService,
		private readonly roomsService: RoomsService
	) {}

	async getBoard(roomId: EntityId, userId: EntityId): Promise<RoomBoardDTO> {
		const user = await this.userRepo.findById(userId, true);
		// TODO no authorisation check here?
		const course = await this.courseRepo.findOne(roomId, userId);
		const board = await this.boardRepo.findByCourseId(roomId);

		// TODO this must be rewritten. Board auto-creation must be treated separately
		await this.roomsService.updateBoard(board, roomId, userId);

		const roomBoardDTO = this.factory.createDTO({ room: course, board, user });
		return roomBoardDTO;
	}

	async updateVisibilityOfBoardElement(
		roomId: EntityId,
		elementId: EntityId,
		userId: EntityId,
		visibility: boolean
	): Promise<void> {
		const user = await this.userRepo.findById(userId);
		const course = await this.courseRepo.findOne(roomId, userId);
		if (!this.authorisationService.hasCourseWritePermission(user, course)) {
			throw new ForbiddenException('you are not allowed to edit this');
		}
		const board = await this.boardRepo.findByCourseId(course.id);
		const element = board.getByTargetId(elementId);
		if (visibility) {
			element.publish();
		} else {
			element.unpublish();
		}

		await this.boardRepo.save(board);
		// TODO if the element is a columnboard, then the visibility must be in sync with it
		// TODO call columnBoard service to update the visibility of the columnboard, based on reference

		if (element instanceof ColumnboardBoardElement) {
			// await this.updateColumnBoardVisibility(element.target._columnBoardId, visibility);
		}
	}

	private async updateColumnBoardVisibility(columbBoardId: EntityId, visibility: boolean) {
		// TODO
		// await this.columnBoardService.updateBoardVisibility(columbBoardId, visibility);
	}

	async reorderBoardElements(roomId: EntityId, userId: EntityId, orderedList: EntityId[]): Promise<void> {
		const user = await this.userRepo.findById(userId);
		const course = await this.courseRepo.findOne(roomId, userId);
		if (!this.authorisationService.hasCourseWritePermission(user, course)) {
			throw new ForbiddenException('you are not allowed to edit this');
		}
		const board = await this.boardRepo.findByCourseId(course.id);
		board.reorderElements(orderedList);
		await this.boardRepo.save(board);
	}
}
