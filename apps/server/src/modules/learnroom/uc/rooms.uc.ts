import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain';
import { CourseRepo, LessonRepo, TaskRepo, UserRepo, BoardRepo } from '@shared/repo';
import { RoomBoardDTOMapper } from '../mapper/room-board-dto.mapper';
import { RoomBoardDTO } from '../types/room-board.types';

@Injectable()
export class RoomsUc {
	constructor(
		private readonly courseRepo: CourseRepo,
		private readonly lessonRepo: LessonRepo,
		private readonly taskRepo: TaskRepo,
		private readonly userRepo: UserRepo,
		private readonly boardRepo: BoardRepo,
		private readonly mapper: RoomBoardDTOMapper
	) {}

	async getBoard(roomId: EntityId, userId: EntityId): Promise<RoomBoardDTO> {
		const user = await this.userRepo.findById(userId, true);
		const course = await this.courseRepo.findOne(roomId, userId);
		const [courseLessons] = await this.lessonRepo.findAllByCourseIds([course.id]);
		const [courseTasks] = await this.taskRepo.findBySingleParent(user.id, course.id);
		const board = await course.getBoard();
		board.syncLessonsFromList(courseLessons);
		board.syncTasksFromList(courseTasks);
		await this.boardRepo.save(board);
		const dto = this.mapper.mapDTO({ room: course, board, user });
		return dto;
	}
}
