import { ColumnBoardService } from '@modules/board';
import { LessonService } from '@modules/lesson';
import { TaskService } from '@modules/task';
import { Injectable } from '@nestjs/common';
import { BoardExternalReferenceType } from '@shared/domain/domainobject';
import { LegacyBoard, ColumnBoardNode } from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';
import { LegacyBoardRepo } from '@shared/repo';
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { BoardNodeRepo } from '@modules/board/repo';

@Injectable()
export class RoomsService {
	constructor(
		private readonly taskService: TaskService,
		private readonly lessonService: LessonService,
		private readonly boardRepo: LegacyBoardRepo,
		private readonly columnBoardService: ColumnBoardService,
		private readonly boardNodeRepo: BoardNodeRepo
	) {}

	async updateLegacyBoard(board: LegacyBoard, roomId: EntityId, userId: EntityId): Promise<LegacyBoard> {
		const [courseLessons] = await this.lessonService.findByCourseIds([roomId]);
		const [courseTasks] = await this.taskService.findBySingleParent(userId, roomId);

		const columnBoardIds = await this.columnBoardService.findIdsByExternalReference({
			type: BoardExternalReferenceType.Course,
			id: roomId,
		});

		const columnBoards = await Promise.all(
			columnBoardIds.map(async (id) => (await this.boardNodeRepo.findById(id)) as ColumnBoardNode)
		);

		const boardElementTargets = [...courseLessons, ...courseTasks, ...columnBoards];

		board.syncBoardElementReferences(boardElementTargets);

		await this.boardRepo.save(board);
		return board;
	}
}
