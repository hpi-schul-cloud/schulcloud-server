import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/mongodb';

import { EntityId, Board } from '@shared/domain';

@Injectable()
export class BoardRepo {
	constructor(private readonly em: EntityManager) {}

	async findById(id: EntityId): Promise<Board> {
		const board = await this.em.findOneOrFail(Board, { id });
		// todo: consistent population
		return board;
	}

	async save(board: Board): Promise<void> {
		await this.em.persistAndFlush(board);
	}
}
