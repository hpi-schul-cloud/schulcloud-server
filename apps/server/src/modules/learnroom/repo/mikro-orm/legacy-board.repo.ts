import { EntityName } from '@mikro-orm/core';
import { CourseEntity } from '@modules/course/repo';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { BaseRepo } from '@shared/repo/base.repo';
import { ColumnBoardBoardElement } from '../mikro-orm/column-board-board-element.entity';
import { LegacyBoard } from '../mikro-orm/legacy-board.entity';
import { LessonBoardElement } from './lesson-board-element.entity';
import { TaskBoardElement } from './task-board-element.entity';

@Injectable()
export class LegacyBoardRepo extends BaseRepo<LegacyBoard> {
	get entityName(): EntityName<LegacyBoard> {
		return LegacyBoard;
	}

	public async findByCourseId(courseId: EntityId): Promise<LegacyBoard> {
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
		const course = await this._em.findOneOrFail(CourseEntity, courseId);
		const board = new LegacyBoard({ course, references: [] });
		await this._em.persist(board).flush();
		return board;
	}

	public async findById(id: EntityId): Promise<LegacyBoard> {
		const board = await this._em.findOneOrFail(LegacyBoard, { id });
		await this.populateBoard(board);
		return board;
	}

	private async populateBoard(board: LegacyBoard): Promise<LegacyBoard> {
		await board.references.init();
		const elements = board.references.getItems();
		const taskElements = elements.filter((el) => el instanceof TaskBoardElement);
		await this._em.populate(taskElements, ['target']);
		const lessonElements = elements.filter((el) => el instanceof LessonBoardElement);
		await this._em.populate(lessonElements, ['target']);
		const columnBoardElements = elements.filter((el) => el instanceof ColumnBoardBoardElement);
		await this._em.populate(columnBoardElements, ['target']);
		return board;
	}
}
