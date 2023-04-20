import { EntityName, FilterQuery, Utils } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { BoardNode, EntityId } from '@shared/domain';

@Injectable()
export class BoardNodeRepo {
	constructor(private readonly em: EntityManager) {}

	async findById<T extends BoardNode>(entityName: EntityName<T>, id: EntityId): Promise<T> {
		const boardNode = await this.em.findOneOrFail(entityName, id as FilterQuery<T>);

		return boardNode;
	}

	async findByIds<T extends BoardNode>(entityName: EntityName<T>, ids: EntityId[]): Promise<T[]> {
		const boardNodes = await this.em.find(entityName, { id: { $in: ids } } as FilterQuery<T>);
		return boardNodes;
	}

	async findDescendants(node: BoardNode, depth?: number): Promise<BoardNode[]> {
		const levelQuery = depth !== undefined ? { $gt: node.level, $lte: node.level + depth } : { $gt: node.level };

		const descendants = await this.em.find(BoardNode, {
			path: { $re: `^${node.path}` },
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

	async save(boardNode: BoardNode | BoardNode[]) {
		const boardNodes = Utils.asArray(boardNode);

		// fill identity map with existing board nodes
		const boardNodeIds = boardNodes.map((bn) => bn.id);
		const existingNodes = await this.em.find(BoardNode, { id: { $in: boardNodeIds } });
		const nodeCache = new Map<EntityId, BoardNode>(existingNodes.map((node) => [node.id, node]));

		boardNodes.forEach((node) => {
			const existing = nodeCache.get(node.id);
			if (existing) {
				this.em.assign(existing, node);
			} else {
				this.em.create(BoardNode, node, { managed: true, persist: true });
			}
		});

		await this.em.flush();
	}
}
