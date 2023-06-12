import { ForbiddenException, Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain';
import { BoardRepo, CourseRepo, UserRepo } from '@shared/repo';
import { RoomsService } from '../service/rooms.service';
import { RoomBoardDTO } from '../types/room-board.types';
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
		const course = await this.courseRepo.findOne(roomId, userId);
		const board = await this.boardRepo.findByCourseId(roomId);

		await this.roomsService.updateBoard(board, roomId, userId);

		const dto = this.factory.createDTO({ room: course, board, user });
		return dto;
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
