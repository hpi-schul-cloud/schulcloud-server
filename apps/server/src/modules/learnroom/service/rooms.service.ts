import { Injectable } from '@nestjs/common';
import { Board, BoardExternalReferenceType, EntityId } from '@shared/domain';
import { BoardRepo, LessonRepo } from '@shared/repo';
import { ColumnBoardService } from '@src/modules/board';
import { TaskService } from '@src/modules/task/service';
import { ColumnBoardTargetService } from './column-board-target.service';

@Injectable()
export class RoomsService {
	constructor(
		private readonly taskService: TaskService,
		private readonly lessonRepo: LessonRepo,
		private readonly boardRepo: BoardRepo,
		private readonly columnBoardService: ColumnBoardService,
		private readonly columnBoardTargetService: ColumnBoardTargetService
	) {}

	async updateBoard(board: Board, roomId: EntityId, userId: EntityId): Promise<Board> {
		const [courseLessons] = await this.lessonRepo.findAllByCourseIds([roomId]);
		const [courseTasks] = await this.taskService.findBySingleParent(userId, roomId);

		const courseReference = {
			type: BoardExternalReferenceType.Course,
			id: roomId,
		};

		const columnBoardIds = await this.columnBoardService.findIdsByExternalReference(courseReference);

		if (columnBoardIds.length === 0) {
			const columnBoard = await this.columnBoardService.create(courseReference);
			columnBoardIds.push(columnBoard.id);
		}

		const courseColumnBoardTargets = await this.columnBoardTargetService.findOrCreateTargets(columnBoardIds);

		const boardElementTargets = [...courseLessons, ...courseTasks, ...courseColumnBoardTargets];

		board.syncBoardElementReferences(boardElementTargets);

		await this.boardRepo.save(board);
		return board;
	}
}
