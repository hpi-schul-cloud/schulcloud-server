import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { Injectable } from '@nestjs/common';
import { Board, BoardExternalReferenceType, ColumnBoardTarget, EntityId } from '@shared/domain';
import { BoardRepo, LessonRepo } from '@shared/repo';
import { ColumnBoardService } from '@src/modules/board';
import { TaskService } from '@src/modules/task/service/task.service';
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

		const courseColumnBoardTargets = await this.handleColumnBoardIntegration(roomId);

		const boardElementTargets = [...courseLessons, ...courseTasks, ...courseColumnBoardTargets];

		board.syncBoardElementReferences(boardElementTargets);

		await this.boardRepo.save(board);
		return board;
	}

	private async handleColumnBoardIntegration(roomId: EntityId): Promise<ColumnBoardTarget[]> {
		let courseColumnBoardTargets: ColumnBoardTarget[] = [];

		if ((Configuration.get('FEATURE_COLUMN_BOARD_ENABLED') as boolean) === true) {
			const courseReference = {
				type: BoardExternalReferenceType.Course,
				id: roomId,
			};

			const columnBoardIds = await this.columnBoardService.findIdsByExternalReference(courseReference);
			if (columnBoardIds.length === 0) {
				const columnBoard = await this.columnBoardService.createWelcomeColumnBoard(courseReference);
				columnBoardIds.push(columnBoard.id);
			}

			courseColumnBoardTargets = await this.columnBoardTargetService.findOrCreateTargets(columnBoardIds);
		}
		return courseColumnBoardTargets;
	}
}
