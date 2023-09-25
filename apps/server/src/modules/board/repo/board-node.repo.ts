import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { BoardNode, DrawingElementNode, EntityId } from '@shared/domain';

@Injectable()
export class BoardNodeRepo {
	constructor(private readonly em: EntityManager) {}

	async findById(id: EntityId): Promise<BoardNode> {
		let entity = this.em.getUnitOfWork().getById<BoardNode>(BoardNode.name, id);
		if (entity) {
			return entity;
		}

		entity = await this.em.findOneOrFail(BoardNode, id);
		return entity;
	}

	async findDescendants(node: BoardNode, depth?: number): Promise<BoardNode[]> {
		const levelQuery = depth !== undefined ? { $gt: node.level, $lte: node.level + depth } : { $gt: node.level };

		const descendants = await this.em.find(BoardNode, {
			path: { $re: `^${node.pathOfChildren}` },
			level: levelQuery,
		});

		return descendants;
	}

	async findDescendantsOfMany(nodes: BoardNode[]): Promise<Record<string, BoardNode[]>> {
		const pathQueries = nodes.map((node) => {
			return { path: { $re: `^${node.pathOfChildren}` } };
		});

		const map: Record<string, BoardNode[]> = {};
		if (pathQueries.length === 0) {
			return map;
		}

		const descendants = await this.em.find(BoardNode, {
			$or: pathQueries,
		});

		// this is for finding tha ancestors of a descendant
		// we use this to group the descendants by ancestor
		// TODO we probably need a more efficient way to do the grouping
		const matchAncestors = (descendant: BoardNode): BoardNode[] => {
			const result = nodes.filter((n) => descendant.path.match(`^${n.pathOfChildren}`));
			return result;
		};

		for (const desc of descendants) {
			const ancestorNodes = matchAncestors(desc);
			ancestorNodes.forEach((node) => {
				map[node.pathOfChildren] ||= [];
				map[node.pathOfChildren].push(desc);
			});
		}
		return map;
	}

	async findByDrawingNameOrFail(drawingName: string): Promise<BoardNode> {
		const nodes = await this.em.findOneOrFail(DrawingElementNode, { drawingName });
		return nodes;
	}
}
