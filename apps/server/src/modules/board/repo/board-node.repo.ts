import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { BoardNode } from '@shared/domain';

@Injectable()
export class BoardNodeRepo {
	constructor(private readonly em: EntityManager) {}

	async findDescendants(node: BoardNode, depth?: number) {
		const levelQuery = depth !== undefined ? { $gt: node.level, $lte: node.level + depth } : { $gt: node.level };

		const descendants = this.em.find(BoardNode, {
			path: { $re: `^${node.path}` },
			level: levelQuery,
		});

		return descendants;
	}
}
