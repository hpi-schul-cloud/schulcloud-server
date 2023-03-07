import { NotImplementedException } from '@nestjs/common';
import { AnyBoardDo, Card, Column, ColumnBoard, TextElement } from '../../domainobject';
import type { BoardNode } from './boardnode.entity';
import type { CardNode } from './card-node.entity';
import type { ColumnBoardNode } from './column-board-node.entity';
import type { ColumnNode } from './column-node.entity';
import type { TextElementNode } from './text-element-node.entity';
import { BoardNodeType } from './types/board-node-type';

export class BoardDoBuilder {
	private childrenMap: Record<string, BoardNode[]> = {};

	constructor(descendants: BoardNode[]) {
		for (const boardNode of descendants) {
			this.childrenMap[boardNode.path] ||= [];
			this.childrenMap[boardNode.path].push(boardNode);
		}
	}

	public buildColumnBoard(boardNode: ColumnBoardNode): ColumnBoard {
		this.ensureBoardNodeType(this.childrenMap[boardNode.pathOfChildren], BoardNodeType.COLUMN);

		const columns = this.buildChildren<Column>(boardNode);

		const columnBoard = new ColumnBoard({
			id: boardNode.id,
			title: boardNode.title,
			columns,
			createdAt: boardNode.createdAt,
			updatedAt: boardNode.updatedAt,
		});

		return columnBoard;
	}

	public buildColumn(boardNode: ColumnNode): Column {
		this.ensureBoardNodeType(this.childrenMap[boardNode.pathOfChildren], BoardNodeType.CARD);

		const cards = this.buildChildren<Card>(boardNode);

		const column = new Column({
			id: boardNode.id,
			title: boardNode.title,
			cards,
			createdAt: boardNode.createdAt,
			updatedAt: boardNode.updatedAt,
		});
		return column;
	}

	public buildCard(boardNode: CardNode): Card {
		this.ensureBoardNodeType(this.childrenMap[boardNode.pathOfChildren], BoardNodeType.TEXT_ELEMENT);

		const elements = this.buildChildren<TextElement>(boardNode);

		const card = new Card({
			id: boardNode.id,
			title: boardNode.title,
			height: boardNode.height,
			elements,
			createdAt: boardNode.createdAt,
			updatedAt: boardNode.updatedAt,
		});
		return card;
	}

	public buildTextElement(boardNode: TextElementNode): TextElement {
		const element = new TextElement({
			id: boardNode.id,
			text: boardNode.text,
			createdAt: boardNode.createdAt,
			updatedAt: boardNode.updatedAt,
		});
		return element;
	}

	buildChildren<T extends AnyBoardDo>(boardNode: BoardNode): T[] {
		const children = this.childrenMap[boardNode.pathOfChildren].map((node) => node.useDoBuilder(this));
		return children as T[];
	}

	ensureBoardNodeType(boardNode: BoardNode | BoardNode[], type: BoardNodeType | BoardNodeType[]) {
		const single = (bn: BoardNode, t: BoardNodeType | BoardNodeType[]) => {
			const isValid = Array.isArray(t) ? type.includes(bn.type) : t === bn.type;
			if (!isValid) {
				throw new NotImplementedException(`Invalid node type '${bn.type}'`);
			}
		};

		if (Array.isArray(boardNode)) {
			boardNode.forEach((bn) => single(bn, type));
		} else {
			single(boardNode, type);
		}
	}
}
