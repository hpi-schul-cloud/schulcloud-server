import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import {
	LegacyBoard,
	ColumnboardBoardElement,
	Course,
	LessonBoardElement,
	TaskBoardElement,
} from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';
import { BoardNodeService, ColumnBoard } from '@src/modules/board';

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

		const taskElements = elements.filter((el) => el instanceof TaskBoardElement);
		await this._em.populate(taskElements, ['target']);

		const lessonElements = elements.filter((el) => el instanceof LessonBoardElement);
		await this._em.populate(lessonElements, ['target']);

		const columnBoardElements = elements.filter(
			(el) => el instanceof ColumnboardBoardElement
		) as ColumnboardBoardElement[];
		const columnBoardIds = columnBoardElements.map((el) => el.id);
		const columnBoards = await this.boardNodeService.findByClassAndIds(ColumnBoard, columnBoardIds);
		columnBoards.forEach((cb) => {
			const match = columnBoardElements.find((el) => el._target.toHexString() === cb.id);
			if (match) {
				match._columnBoard = cb;
			}
		});

		return board;
	}
}
