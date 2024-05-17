import { ForbiddenException, Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { CourseRepo, LegacyBoardRepo, UserRepo } from '@shared/repo';
import { RoomsService } from '../service/rooms.service';
import { RoomBoardDTO } from '../types';
import { RoomBoardDTOFactory } from './room-board-dto.factory';
import { RoomsAuthorisationService } from './rooms.authorisation.service';

@Injectable()
export class RoomsUc {
	constructor(
		private readonly courseRepo: CourseRepo,
		private readonly userRepo: UserRepo,
		private readonly legacyBoardRepo: LegacyBoardRepo,
		private readonly factory: RoomBoardDTOFactory,
		private readonly authorisationService: RoomsAuthorisationService,
		private readonly roomsService: RoomsService
	) {}

	async getBoard(roomId: EntityId, userId: EntityId): Promise<RoomBoardDTO> {
		const user = await this.userRepo.findById(userId, true);
		// TODO no authorisation check here?
		const course = await this.courseRepo.findOne(roomId, userId);
		const legacyBoard = await this.legacyBoardRepo.findByCourseId(roomId);

		// TODO this must be rewritten. Board auto-creation must be treated separately
		await this.roomsService.updateLegacyBoard(legacyBoard, roomId, userId);

		const roomBoardDTO = this.factory.createDTO({ room: course, board: legacyBoard, user });
		return roomBoardDTO;
	}

	async updateVisibilityOfLegacyBoardElement(
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
		const legacyBoard = await this.legacyBoardRepo.findByCourseId(course.id);
		const element = legacyBoard.getByTargetId(elementId);
		if (visibility) {
			element.publish();
		} else {
			element.unpublish();
		}

		await this.legacyBoardRepo.save(legacyBoard);
		// TODO if the element is a columnboard, then the visibility must be in sync with it
		// TODO call columnBoard service to update the visibility of the columnboard, based on reference

		// if (element instanceof ColumnboardBoardElement) {
		// await this.updateColumnBoardVisibility(element.target._columnBoardId, visibility);
		// }
	}

	/*
	private async updateColumnBoardVisibility(columbBoardId: EntityId, visibility: boolean) {
		// TODO
		// await this.columnBoardService.updateBoardVisibility(columbBoardId, visibility);
	}
*/
	async reorderBoardElements(roomId: EntityId, userId: EntityId, orderedList: EntityId[]): Promise<void> {
		const user = await this.userRepo.findById(userId);
		const course = await this.courseRepo.findOne(roomId, userId);
		if (!this.authorisationService.hasCourseWritePermission(user, course)) {
			throw new ForbiddenException('you are not allowed to edit this');
		}
		const legacyBoard = await this.legacyBoardRepo.findByCourseId(course.id);
		legacyBoard.reorderElements(orderedList);
		await this.legacyBoardRepo.save(legacyBoard);
	}
}
