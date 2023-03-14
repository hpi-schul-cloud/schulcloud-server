import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { ColumnBoard, ColumnBoardNode, EntityId } from '@shared/domain';
import { BoardDoBuilder } from '@shared/domain/entity/boardnode/board-do.builder';
import { BoardNodeRepo } from './board-node.repo';

@Injectable()
export class ColumnBoardRepo {
	constructor(private readonly em: EntityManager, private readonly boardNodeRepo: BoardNodeRepo) {}

	async findById(boardId: EntityId): Promise<ColumnBoard> {
		const boardNode = await this.em.findOneOrFail(ColumnBoardNode, {
			id: boardId,
		});
		const descendants = await this.boardNodeRepo.findDescendants(boardNode, 3);
		const domainObject = new BoardDoBuilder(descendants).buildColumnBoard(boardNode);

		return domainObject;
	}
}
