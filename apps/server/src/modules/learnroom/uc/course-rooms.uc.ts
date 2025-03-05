import { CourseService } from '@modules/course';
import { UserRepo } from '@modules/user/repo';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { LegacyBoardRepo } from '../repo';
import { CourseRoomsService } from '../service/course-rooms.service';
import { RoomBoardDTO } from '../types';
import { CourseRoomsAuthorisationService } from './course-rooms.authorisation.service';
import { RoomBoardDTOFactory } from './room-board-dto.factory';

/**
 *
 * https://niedersachsen.cloud/rooms/5e700020c3b6f0002b6c6960
 * legacy learroom (course details) page
 *
 * https://niedersachsen.cloud/rooms/6792532dc48b5bc0b75125ae
 * new rooms
 *
 * course api module
 * --> course module
 * --> legacy course board -> couse module
 * --> course dashboard -> course module
 * Es gibt mehre weitere Module die dependencies auf course module hat.
 */
@Injectable()
export class CourseRoomsUc {
	constructor(
		private readonly courseService: CourseService,
		private readonly userRepo: UserRepo,
		private readonly legacyBoardRepo: LegacyBoardRepo, // zu ein LegacyBoard gibt es genau ein Course
		private readonly factory: RoomBoardDTOFactory,
		private readonly authorisationService: CourseRoomsAuthorisationService,
		private readonly roomsService: CourseRoomsService
	) {}

	public async getBoard(roomId: EntityId, userId: EntityId): Promise<RoomBoardDTO> {
		const user = await this.userRepo.findById(userId, true);
		// TODO no authorisation check here?
		const course = await this.courseService.findOneForUser(roomId, userId);
		const legacyBoard = await this.legacyBoardRepo.findByCourseId(roomId);

		// TODO this must be rewritten. Board auto-creation must be treated separately
		await this.roomsService.updateLegacyBoard(legacyBoard, roomId, userId);

		const roomBoardDTO = this.factory.createDTO({ room: course, board: legacyBoard, user });

		return roomBoardDTO;
	}

	public async updateVisibilityOfLegacyBoardElement(
		roomId: EntityId,
		elementId: EntityId,
		userId: EntityId,
		visibility: boolean
	): Promise<void> {
		const user = await this.userRepo.findById(userId);
		const course = await this.courseService.findOneForUser(roomId, userId);
		if (!this.authorisationService.hasCourseWritePermission(user, course)) {
			throw new ForbiddenException('you are not allowed to edit this');
		}
		const legacyBoard = await this.legacyBoardRepo.findByCourseId(course.id);
		const element = legacyBoard.getByTargetId(elementId);

		if (visibility) {
			element.publish();
			// legacyBoard.publishElement(elementId)
		} else {
			element.unpublish();
			// legacyBoard.unpublishElement(elementId)
		}

		await this.legacyBoardRepo.save(legacyBoard);
		// TODO if the element is a columnboard, then the visibility must be in sync with it
		// TODO call columnBoard service to update the visibility of the columnboard, based on reference

		// if (element instanceof ColumnBoardBoardElement) {
		// await this.updateColumnBoardVisibility(element.target._columnBoardId, visibility);
		// }
	}

	/*
	private async updateColumnBoardVisibility(columbBoardId: EntityId, visibility: boolean) {
		// TODO
		// await this.columnBoardService.updateBoardVisibility(columbBoardId, visibility);
	}
*/
	public async reorderBoardElements(roomId: EntityId, userId: EntityId, orderedList: EntityId[]): Promise<void> {
		const user = await this.userRepo.findById(userId);
		const course = await this.courseService.findOneForUser(roomId, userId);
		if (!this.authorisationService.hasCourseWritePermission(user, course)) {
			throw new ForbiddenException('you are not allowed to edit this');
		}
		const legacyBoard = await this.legacyBoardRepo.findByCourseId(course.id);
		legacyBoard.reorderElements(orderedList);
		await this.legacyBoardRepo.save(legacyBoard);
	}
}
