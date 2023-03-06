import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { BoardNode, BoardNodeType, ColumnBoard, EntityId } from '@shared/domain';
import { AnyBoardDoBuilder } from '../mapper';
import { BoardNodeRepo } from './board-node.repo';

@Injectable()
export class ColumnBoardRepo {
	constructor(
		private readonly em: EntityManager,
		private readonly boardNodeRepo: BoardNodeRepo,
		private readonly domainObjectBuilder: AnyBoardDoBuilder
	) {}

	async findById(boardId: EntityId): Promise<ColumnBoard> {
		const boardNode = await this.em.findOneOrFail(BoardNode, { id: boardId, type: BoardNodeType.COLUMN_BOARD });
		const descendants = await this.boardNodeRepo.findDescendants(boardNode, 3);
		const domainObject = this.domainObjectBuilder.buildTree(boardNode, descendants);

		return domainObject as ColumnBoard;
	}
}
