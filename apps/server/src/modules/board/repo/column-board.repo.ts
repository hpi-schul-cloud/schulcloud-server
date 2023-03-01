import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { BoardNode } from '@shared/domain';

@Injectable()
export class ColumnBoardRepo {
	constructor(private readonly em: EntityManager) {}

	// TODO mapping BoardNodes => DOs
	// async findById(boardId: EntityId): Promise<ColumnBoard> {
	// 	const boardNode = await this.em.findOneOrFail(BoardNode, { id: boardId, type: BoardNodeType.BOARD });

	// 	const boardDescendants = await this.findDescendants(boardNode, 2);
	// }

	async findDescendants(node: BoardNode, depth: number) {
		const descendants = this.em.find(BoardNode, {
			path: { $re: `^${node.path}` },
			level: { $gt: node.level, $lte: node.level + depth },
		});

		return descendants;
	}
}
