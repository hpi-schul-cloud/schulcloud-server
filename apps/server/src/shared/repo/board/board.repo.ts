import { Injectable } from '@nestjs/common';
import { Course } from '@shared/domain/entity/course.entity';
import { Board } from '@shared/domain/entity/legacy-board/board.entity';
import { ColumnboardBoardElement } from '@shared/domain/entity/legacy-board/column-board-boardelement';
import { LessonBoardElement } from '@shared/domain/entity/legacy-board/lesson-boardelement.entity';
import { TaskBoardElement } from '@shared/domain/entity/legacy-board/task-boardelement.entity';
import { EntityId } from '@shared/domain/types/entity-id';
import { BaseRepo } from '../base.repo';

@Injectable()
export class BoardRepo extends BaseRepo<Board> {
	get entityName() {
		return Board;
	}

	async findByCourseId(courseId: EntityId): Promise<Board> {
		const board = await this.getOrCreateCourseBoard(courseId);
		await this.populateBoard(board);
		return board;
	}

	private async getOrCreateCourseBoard(courseId: EntityId): Promise<Board> {
		let board = await this._em.findOne(Board, { course: courseId });
		if (!board) {
			board = await this.createBoardForCourse(courseId);
		}
		return board;
	}

	private async createBoardForCourse(courseId: EntityId): Promise<Board> {
		const course = await this._em.findOneOrFail(Course, courseId);
		const board = new Board({ course, references: [] });
		await this._em.persistAndFlush(board);
		return board;
	}

	async findById(id: EntityId): Promise<Board> {
		const board = await this._em.findOneOrFail(Board, { id });
		await this.populateBoard(board);
		return board;
	}

	private async populateBoard(board: Board) {
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
