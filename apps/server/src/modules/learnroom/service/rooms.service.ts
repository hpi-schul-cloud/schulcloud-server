import { FilterQuery } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { Board, BoardExternalReferenceType, ColumnBoardTarget, EntityId } from '@shared/domain';
import { BoardRepo, LessonRepo } from '@shared/repo';
import { ColumnBoardService } from '@src/modules/board';
import { TaskService } from '@src/modules/task/service';

@Injectable()
export class RoomsService {
	constructor(
		private readonly taskService: TaskService,
		private readonly lessonRepo: LessonRepo,
		private readonly boardRepo: BoardRepo,
		private readonly columnBoardService: ColumnBoardService,
		private readonly em: EntityManager
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

		const courseColumnBoardTargets = await this.findOrCreateColumnBoardTargets(columnBoardIds);

		const boardElementTargets = [...courseLessons, ...courseTasks, ...courseColumnBoardTargets];

		board.syncBoardElementReferences(boardElementTargets);

		await this.boardRepo.save(board);
		return board;
	}

	private async findOrCreateColumnBoardTargets(columnBoardIds: string[]): Promise<ColumnBoardTarget[]> {
		const existingTargets = await this.em.find(ColumnBoardTarget, {
			_columnBoardId: { $in: columnBoardIds },
		} as unknown as FilterQuery<ColumnBoardTarget>);

		const titlesMap = await this.columnBoardService.getBoardObjectTitlesById(columnBoardIds);

		const columnBoardTargets = columnBoardIds.map((id) => {
			const title = titlesMap[id] ?? '';
			let target = existingTargets.find((item) => item.columnBoardId === id);
			if (target) {
				target.title = title;
			} else {
				target = new ColumnBoardTarget({ columnBoardId: id, title });
			}
			this.em.persist(target);
			return target;
		});

		await this.em.flush();

		return columnBoardTargets;
	}
}
