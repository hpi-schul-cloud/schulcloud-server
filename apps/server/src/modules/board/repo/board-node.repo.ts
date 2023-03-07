import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { BoardNode } from '@shared/domain';

@Injectable()
export class BoardNodeRepo {
	constructor(private readonly em: EntityManager) {}

	async findDescendants(node: BoardNode, depth?: number): Promise<BoardNode[]> {
		const levelQuery = depth !== undefined ? { $gt: node.level, $lte: node.level + depth } : { $gt: node.level };

		const descendants = await this.em.find(BoardNode, {
			path: { $re: `^${node.path}` },
			level: levelQuery,
		});

		return descendants;
	}

	async findChildrenOfMany(nodes: BoardNode[]): Promise<Record<string, BoardNode[]>> {
		const paths = nodes.map((node) => node.pathOfChildren);
		const children = await this.em.find(BoardNode, { path: { $in: paths } });

		const map: Record<string, BoardNode[]> = {};
		for (const child of children) {
			map[child.path] ||= [];
			map[child.path].push(child);
		}
		return map;
	}

	// TODO. findDescendantsOfMany
}
