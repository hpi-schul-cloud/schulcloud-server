import { Injectable, ForbiddenException } from '@nestjs/common';
import { EntityId, Board } from '@shared/domain';
import { CourseRepo, LessonRepo, TaskRepo, UserRepo, BoardRepo } from '@shared/repo';
import { RoomBoardDTOFactory } from './room-board-dto.factory';
import { RoomsAuthorisationService } from './rooms.authorisation.service';
import { RoomBoardDTO } from '../types/room-board.types';

@Injectable()
export class RoomsUc {
	constructor(
		private readonly courseRepo: CourseRepo,
		private readonly lessonRepo: LessonRepo,
		private readonly taskRepo: TaskRepo,
		private readonly userRepo: UserRepo,
		private readonly boardRepo: BoardRepo,
		private readonly factory: RoomBoardDTOFactory,
		private readonly authorisationService: RoomsAuthorisationService
	) {}

	async getBoard(roomId: EntityId, userId: EntityId): Promise<RoomBoardDTO> {
		const user = await this.userRepo.findById(userId, true);
		const course = await this.courseRepo.findOne(roomId, userId);
		let board = await this.boardRepo.findByCourseId(course.id);

		board = await this.updateBoard(board, roomId, userId);

		const dto = this.factory.createDTO({ room: course, board, user });
		return dto;
	}

	private async updateBoard(board: Board, roomId: EntityId, userId: EntityId): Promise<Board> {
		const [courseLessons] = await this.lessonRepo.findAllByCourseIds([roomId]);
		const [courseTasks] = await this.taskRepo.findBySingleParent(userId, roomId);
		board.syncLessonsFromList(courseLessons);
		board.syncTasksFromList(courseTasks);
		await this.boardRepo.save(board);
		return board;
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
