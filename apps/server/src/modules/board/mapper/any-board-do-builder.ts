import { BoardNode } from '@shared/domain';
import { AnyBoardDo } from '../types/any-board-do';
import { CardBuilder } from './card-builder';
import { ColumnBoardBuilder } from './column-board-builder';
import { ColumnBuilder } from './column-builder';
import { ElementBuilder } from './element-builder';

export class AnyBoardDoBuilder {
	public static build(boardNode: BoardNode, children: AnyBoardDo[] = []): AnyBoardDo | undefined {
		return (
			ColumnBoardBuilder.build(boardNode, children) ??
			ColumnBuilder.build(boardNode, children) ??
			CardBuilder.build(boardNode, children) ??
			ElementBuilder.build(boardNode)
		);
	}

	public static buildTree(root: BoardNode, descendants: BoardNode[]) {
		AnyBoardDoBuilder.sortBoardNodes(descendants);

		const childrenMap: Record<string, AnyBoardDo[]> = {};
		for (const boardNode of descendants) {
			const { parentId } = boardNode;
			if (parentId) {
				const children: AnyBoardDo[] = childrenMap[boardNode.id] ?? [];
				const domainObject = AnyBoardDoBuilder.build(boardNode, children);
				if (domainObject) {
					if (childrenMap[parentId] === undefined) {
						childrenMap[parentId] = [];
					}
					childrenMap[parentId].push(domainObject);
				}
			}
		}

		const rootDO = AnyBoardDoBuilder.build(root, childrenMap[root.id]);
		return rootDO;
	}

	public static sortBoardNodes(boardNodes: BoardNode[]) {
		boardNodes.sort((a, b) => {
			if (a.path === b.path) {
				return (a.position ?? 0) - (b.position ?? 0); // by position asc
			}

			return a.path > b.path ? -1 : 1; // by path desc
		});
	}
}
