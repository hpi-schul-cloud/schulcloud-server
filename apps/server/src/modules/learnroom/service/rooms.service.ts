import { Injectable } from '@nestjs/common';
import { Board, EntityId } from '@shared/domain';
import { BoardRepo, LessonRepo } from '@shared/repo';
import { ColumnBoardService } from '@src/modules/board';
import { TaskService } from '@src/modules/task/service';

@Injectable()
export class RoomsService {
	constructor(
		private readonly taskService: TaskService,
		private readonly lessonRepo: LessonRepo,
		private readonly boardRepo: BoardRepo,
		private readonly columnBoardService: ColumnBoardService
	) {}

	async updateBoard(board: Board, roomId: EntityId, userId: EntityId): Promise<Board> {
		const [courseLessons] = await this.lessonRepo.findAllByCourseIds([roomId]);
		const [courseTasks] = await this.taskService.findBySingleParent(userId, roomId);
		const courseColumnBoards = await this.columnBoardService.findAllByParentReference(roomId);

		// const boardElementTargets = [...courseLessons, ...courseTasks, ...courseColumnBoards];
		// WIP : BC-3573 : saving the board throws error, when columnBoards are included... don't know why

		const boardElementTargets = [...courseLessons, ...courseTasks];
		board.syncBoardElementReferences(boardElementTargets);

		await this.boardRepo.save(board);
		return board;
	}
}
