import { Injectable } from '@nestjs/common';
import { Board, EntityId } from '@shared/domain';
import { BoardRepo, LessonRepo, TaskRepo } from '@shared/repo';

@Injectable()
export class RoomsService {
	constructor(
		private readonly taskRepo: TaskRepo,
		private readonly lessonRepo: LessonRepo,
		private readonly boardRepo: BoardRepo
	) {}

	async updateBoard(board: Board, roomId: EntityId, userId: EntityId): Promise<Board> {
		const [courseLessons] = await this.lessonRepo.findAllByCourseIds([roomId]);
		const [courseTasks] = await this.taskRepo.findBySingleParent(userId, roomId, { userId });
		board.syncTasksFromList(courseTasks);
		board.syncLessonsFromList(courseLessons);
		await this.boardRepo.save(board);
		return board;
	}
}
