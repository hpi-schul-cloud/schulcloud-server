import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { ColumnBoardService } from '@modules/board';
import { LessonService } from '@modules/lesson';
import { TaskService } from '@modules/task';
import { Injectable } from '@nestjs/common';
import { BoardExternalReferenceType } from '@shared/domain/domainobject';
import { LegacyBoard, ColumnBoardNode } from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';
import { LegacyBoardRepo } from '@shared/repo';
import { BoardNodeRepo } from '@modules/board/repo';

@Injectable()
export class RoomsService {
	constructor(
		private readonly taskService: TaskService,
		private readonly lessonService: LessonService,
		private readonly boardRepo: LegacyBoardRepo,
		private readonly columnBoardService: ColumnBoardService,
		private readonly boardNodeRepo: BoardNodeRepo // private readonly columnBoardTargetService: ColumnBoardTargetService
	) {}

	async updateLegacyBoard(board: LegacyBoard, roomId: EntityId, userId: EntityId): Promise<LegacyBoard> {
		const [courseLessons] = await this.lessonService.findByCourseIds([roomId]);
		const [courseTasks] = await this.taskService.findBySingleParent(userId, roomId);

		const columnBoards = await this.handleColumnBoardIntegration(roomId);

		const boardElementTargets = [...courseLessons, ...courseTasks, ...columnBoards];

		board.syncBoardElementReferences(boardElementTargets);

		await this.boardRepo.save(board);
		return board;
	}

	private async handleColumnBoardIntegration(roomId: EntityId): Promise<ColumnBoardNode[]> {
		let columnBoards: ColumnBoardNode[] = [];

		if ((Configuration.get('FEATURE_COLUMN_BOARD_ENABLED') as boolean) === true) {
			const courseReference = {
				type: BoardExternalReferenceType.Course,
				id: roomId,
			};

			const columnBoardIds = await this.columnBoardService.findIdsByExternalReference(courseReference);

			if (columnBoardIds.length === 0) {
				await this.columnBoardService.createWelcomeColumnBoard(courseReference);
			}

			columnBoards = await Promise.all(
				columnBoardIds.map(async (id) => this.boardNodeRepo.findById(id) as Promise<ColumnBoardNode>)
			);
		}

		return columnBoards;
	}
}
