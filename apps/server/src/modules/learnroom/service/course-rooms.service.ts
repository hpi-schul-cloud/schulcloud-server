import { BoardExternalReferenceType } from '@modules/board';
import { LessonService } from '@modules/lesson';
import { TaskService } from '@modules/task';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { ColumnBoardNodeRepo, LegacyBoard, LegacyBoardRepo } from '../repo';

/**
 * @deprecated - the learnroom module is deprecated and will be removed in the future
 */
@Injectable()
export class CourseRoomsService {
	constructor(
		private readonly taskService: TaskService,
		private readonly lessonService: LessonService,
		private readonly boardRepo: LegacyBoardRepo,
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
