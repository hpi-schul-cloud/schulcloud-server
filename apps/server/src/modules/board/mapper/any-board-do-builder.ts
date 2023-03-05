import { Injectable, NotImplementedException } from '@nestjs/common';
import { BoardNode, BoardNodeType, AnyBoardDo } from '@shared/domain';
import { BoardDoBuilder } from './board-do-builder';
import { CardBuilder } from './card-builder';
import { ColumnBoardBuilder } from './column-board-builder';
import { ColumnBuilder } from './column-builder';
import { ElementBuilder } from './element-builder';

@Injectable()
export class AnyBoardDoBuilder extends BoardDoBuilder {
	private builders: Map<BoardNodeType, BoardDoBuilder> = new Map();

	constructor() {
		super();
		this.builders.set(BoardNodeType.BOARD, new ColumnBoardBuilder());
		this.builders.set(BoardNodeType.COLUMN, new ColumnBuilder());
		this.builders.set(BoardNodeType.CARD, new CardBuilder());
		this.builders.set(BoardNodeType.ELEMENT, new ElementBuilder());
	}

	public build(boardNode: BoardNode, children: AnyBoardDo[] = []): AnyBoardDo {
		const builder = this.builders.get(boardNode.type);

		if (builder == null) {
			throw new NotImplementedException('Invalid node type `$boardNode.type}`');
		}

		const domainObject = builder.build(boardNode, children);

		return domainObject;
	}

	public buildTree(root: BoardNode, descendants: BoardNode[]) {
		this.sortBoardNodes(descendants);

		const childrenMap: Record<string, AnyBoardDo[]> = {};
		for (const boardNode of descendants) {
			const { parentId } = boardNode;
			if (parentId) {
				const children: AnyBoardDo[] = childrenMap[boardNode.id] ?? [];
				const domainObject = this.build(boardNode, children);
				if (childrenMap[parentId] === undefined) {
					childrenMap[parentId] = [];
				}
				childrenMap[parentId].push(domainObject);
			}
		}

		const rootDomainObject = this.build(root, childrenMap[root.id]);
		return rootDomainObject;
	}

	public sortBoardNodes(boardNodes: BoardNode[]) {
		boardNodes.sort((a, b) => {
			if (a.path === b.path) {
				return (a.position ?? 0) - (b.position ?? 0); // by position asc
			}

			return a.path > b.path ? -1 : 1; // by path desc
		});
	}
}
