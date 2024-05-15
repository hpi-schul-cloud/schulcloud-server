import { EntityManager } from '@mikro-orm/mongodb';
import { BoardNodeService } from '@modules/board/service/board-node.service';
import { Injectable } from '@nestjs/common';
import {
	ColumnboardBoardElement,
	Course,
	LegacyBoard,
	LessonBoardElement,
	TaskBoardElement,
} from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';
import { ColumnBoard } from '@modules/board';

@Injectable()
export class LegacyBoardRepo {
	constructor(private readonly _em: EntityManager, private readonly boardNodeService: BoardNodeService) {}

	get entityName() {
		return LegacyBoard;
	}

	create(entity: LegacyBoard): LegacyBoard {
		return this._em.create(LegacyBoard, entity);
	}

	async save(entities: LegacyBoard | LegacyBoard[]): Promise<void> {
		await this._em.persistAndFlush(entities);
	}

	async delete(entities: LegacyBoard | LegacyBoard[]): Promise<void> {
		await this._em.removeAndFlush(entities);
	}

	async findByCourseId(courseId: EntityId): Promise<LegacyBoard> {
		// TODO this auto-creation of board should be moved to uc instead of in repo
		const board = await this.getOrCreateCourseBoard(courseId);
		await this.populateBoard(board);
		return board;
	}

	private async getOrCreateCourseBoard(courseId: EntityId): Promise<LegacyBoard> {
		let board = await this._em.findOne(LegacyBoard, { course: courseId });
		if (!board) {
			board = await this.createBoardForCourse(courseId);
		}
		return board;
	}

	private async createBoardForCourse(courseId: EntityId): Promise<LegacyBoard> {
		const course = await this._em.findOneOrFail(Course, courseId);
		const board = new LegacyBoard({ course, references: [] });
		await this._em.persistAndFlush(board);
		return board;
	}

	async findById(id: EntityId): Promise<LegacyBoard> {
		const board = await this._em.findOneOrFail(LegacyBoard, { id });
		await this.populateBoard(board);
		return board;
	}

	private async populateBoard(board: LegacyBoard) {
		await board.references.init();
		const elements = board.references.getItems();

		const taskElements = elements.filter((el) => el instanceof TaskBoardElement) as TaskBoardElement[];
		await this._em.populate(taskElements, ['_target']);

		const lessonElements = elements.filter((el) => el instanceof LessonBoardElement) as LessonBoardElement[];
		await this._em.populate(lessonElements, ['_target']);

		const columnBoardElements = elements.filter(
			(el) => el instanceof ColumnboardBoardElement
		) as ColumnboardBoardElement[];
		const columnBoardIds = columnBoardElements.map((el) => el.id);
		const columnBoards = await this.boardNodeService.findByClassAndIds(ColumnBoard, columnBoardIds, 0);
		columnBoards.forEach((cb) => {
			const match = columnBoardElements.find((el) => el._target.toHexString() === cb.id);
			if (match) {
				match._columnBoard = cb;
			}
		});

		return board;
	}
}
