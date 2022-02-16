import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/mongodb';

import { EntityId, Board, Course } from '@shared/domain';

@Injectable()
export class BoardRepo {
	constructor(private readonly em: EntityManager) {}

	async findByCourseId(courseId: EntityId): Promise<Board> {
		let board = await this.em.findOne(Board, { course: courseId });
		if (!board) {
			// TODO: find a way to not require access to the course collection
			const course = await this.em.findOneOrFail(Course, courseId);
			board = new Board({ course, references: [] });
			await this.em.persistAndFlush(board);
		}
		return board;
	}

	async findById(id: EntityId): Promise<Board> {
		const board = await this.em.findOneOrFail(Board, { id });
		// todo: consistent population
		return board;
	}

	async save(board: Board): Promise<void> {
		await this.em.persistAndFlush(board);
	}
}
