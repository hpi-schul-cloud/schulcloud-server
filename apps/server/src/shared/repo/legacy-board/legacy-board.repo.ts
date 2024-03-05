import { Injectable } from '@nestjs/common';
import {
	LegacyBoard,
	ColumnboardBoardElement,
	Course,
	LessonBoardElement,
	TaskBoardElement,
} from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';
import { BaseRepo } from '../base.repo';

@Injectable()
export class LegacyBoardRepo extends BaseRepo<LegacyBoard> {
	get entityName() {
		return LegacyBoard;
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
		const columnBoardElements = elements.filter((el) => el instanceof ColumnboardBoardElement);
		await this._em.populate(columnBoardElements, ['target']);
		return board;
	}
}
