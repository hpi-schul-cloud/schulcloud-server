import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/mongodb';

import { EntityId, Board, Course, TaskBoardElement, LessonBoardElement } from '@shared/domain';

@Injectable()
export class BoardRepo {
	constructor(private readonly em: EntityManager) {}

	async findByCourseId(courseId: EntityId): Promise<Board> {
		const board = await this.getOrCreateCourseBoard(courseId);
		await this.populateBoard(board);
		return board;
	}

	private async getOrCreateCourseBoard(courseId: EntityId): Promise<Board> {
		let board = await this.em.findOne(Board, { course: courseId });
		if (!board) {
			board = await this.createBoardForCourse(courseId);
		}
		return board;
	}

	private async createBoardForCourse(courseId: EntityId): Promise<Board> {
		const course = await this.em.findOneOrFail(Course, courseId);
		const board = new Board({ course, references: [] });
		await this.em.persistAndFlush(board);
		return board;
	}

	async findById(id: EntityId): Promise<Board> {
		const board = await this.em.findOneOrFail(Board, { id });
		await this.populateBoard(board);
		return board;
	}

	private async populateBoard(board: Board) {
		await board.references.init();
		const elements = board.references.getItems();
		const discriminatorColumn = 'target';
		const taskElements = elements.filter((el) => el instanceof TaskBoardElement);
		await this.em.populate(taskElements, [discriminatorColumn]);
		const lessonElements = elements.filter((el) => el instanceof LessonBoardElement);
		await this.em.populate(lessonElements, [discriminatorColumn]);
		return board;
	}

	async save(board: Board): Promise<void> {
		await this.em.persistAndFlush(board);
		return Promise.resolve();
	}
}
