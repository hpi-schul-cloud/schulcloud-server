import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { BoardNode, EntityId } from '@shared/domain';
import { AnyBoardDoBuilder } from '../mapper/any-board-do-builder';
import { AnyBoardDo } from '../types/any-board-do';

@Injectable()
export class ColumnBoardRepo {
	constructor(private readonly em: EntityManager) {}

	async findById(boardNodeId: EntityId, levelsOfChildren = 0): Promise<AnyBoardDo | undefined> {
		const boardNode = await this.em.findOneOrFail(BoardNode, { id: boardNodeId });
		let descendants: BoardNode[] = [];
		if (levelsOfChildren > 0) {
			const depth = boardNode.level + levelsOfChildren;
			descendants = await this.findDescendants(boardNode, depth);
		}
		return AnyBoardDoBuilder.buildTree(boardNode, descendants);
	}

	async findDescendants(node: BoardNode, depth: number) {
		const descendants = this.em.find(BoardNode, {
			path: { $re: `^${node.path}` },
			level: { $gt: node.level, $lte: node.level + depth },
		});

		return descendants;
	}

	// async findById(boardId: EntityId): Promise<ColumnBoard> {
	// 	const boardNode = await this.em.findOneOrFail(BoardNode, { id: boardId });
	// 	return boardNode;
	// }
}
