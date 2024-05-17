import { BoardExternalReferenceType } from '@modules/board/domain';
import { ColumnBoardService } from '@modules/board/service';
import { LessonService } from '@modules/lesson';
import { TaskService } from '@modules/task';
import { Injectable } from '@nestjs/common';
import { LegacyBoard } from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';
import { LegacyBoardRepo } from '@shared/repo';
import { ColumnBoardNodeRepo } from '../repo';

@Injectable()
export class RoomsService {
	constructor(
		private readonly taskService: TaskService,
		private readonly lessonService: LessonService,
		private readonly boardRepo: LegacyBoardRepo,
		private readonly columnBoardService: ColumnBoardService,
		private readonly columnBoardNodeRepo: ColumnBoardNodeRepo
	) {}

	async updateLegacyBoard(board: LegacyBoard, roomId: EntityId, userId: EntityId): Promise<LegacyBoard> {
		const [courseLessons] = await this.lessonService.findByCourseIds([roomId]);
		const [courseTasks] = await this.taskService.findBySingleParent(userId, roomId);

		// TODO comment this, legacy!
		const columnBoardNodes = await this.columnBoardNodeRepo.findByExternalReference({
			type: BoardExternalReferenceType.Course,
			id: roomId,
		});

		const boardElementTargets = [...courseLessons, ...courseTasks, ...columnBoardNodes];

		board.syncBoardElementReferences(boardElementTargets);

		await this.boardRepo.save(board);
		return board;
	}
}
