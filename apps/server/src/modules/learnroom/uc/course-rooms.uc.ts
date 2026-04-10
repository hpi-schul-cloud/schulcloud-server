import { CourseService } from '@modules/course';
import { UserService } from '@modules/user';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { LockedCourseLoggableException } from '../loggable';
import { LegacyBoardRepo } from '../repo';
import { CourseRoomsService } from '../service/course-rooms.service';
import { isColumnBoard, RoomBoardDTO } from '../types';
import { CourseRoomsAuthorisationService } from './course-rooms.authorisation.service';
import { RoomBoardDTOFactory } from './room-board-dto.factory';

@Injectable()
export class CourseRoomsUc {
	constructor(
		private readonly userService: UserService,
		private readonly courseService: CourseService,
		private readonly legacyBoardRepo: LegacyBoardRepo,
		private readonly factory: RoomBoardDTOFactory,
		private readonly authorisationService: CourseRoomsAuthorisationService,
		private readonly roomsService: CourseRoomsService
	) {}

	public async getBoard(roomId: EntityId, userId: EntityId): Promise<RoomBoardDTO> {
		const user = await this.userService.getUserEntityWithRoles(userId);
		// TODO no authorisation check here?
		const course = await this.courseService.findOneForUser(roomId, userId, user.school.id);

		const { isLocked } = course.getMetadata();
		if (isLocked) {
			throw new LockedCourseLoggableException(course.name, course.id);
		}

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
		const user = await this.userService.getUserEntityWithRoles(userId);
		const course = await this.courseService.findOneForUser(roomId, userId, user.school.id);

		if (!this.authorisationService.hasCourseWritePermission(user, course)) {
			throw new ForbiddenException('you are not allowed to edit this');
		}
		const legacyBoard = await this.legacyBoardRepo.findByCourseId(course.id);
		const element = legacyBoard.getByTargetId(elementId);

		if (isColumnBoard(element)) {
			(element as { isVisible: boolean }).isVisible = visibility;
		} else {
			if (visibility) {
				element.publish();
			} else {
				element.unpublish();
			}
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
		const user = await this.userService.getUserEntityWithRoles(userId);
		const course = await this.courseService.findOneForUser(roomId, userId, user.school.id);

		if (!this.authorisationService.hasCourseWritePermission(user, course)) {
			throw new ForbiddenException('you are not allowed to edit this');
		}
		const legacyBoard = await this.legacyBoardRepo.findByCourseId(course.id);
		legacyBoard.reorderElements(orderedList);
		await this.legacyBoardRepo.save(legacyBoard);
	}
}
