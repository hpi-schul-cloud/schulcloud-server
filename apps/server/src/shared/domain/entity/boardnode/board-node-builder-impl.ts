import { AnyBoardDo, Card, Column, ColumnBoard, TextElement } from '@shared/domain/domainobject';
import { EntityId } from '@shared/domain/types';
import { BoardNodeBuilder } from '../../domainobject/board/types/board-node-builder';
import { BoardNode } from './boardnode.entity';
import { CardNode } from './card-node.entity';
import { ColumnBoardNode } from './column-board-node.entity';
import { ColumnNode } from './column-node.entity';
import { TextElementNode } from './text-element-node.entity';

export class BoardNodeBuilderImpl implements BoardNodeBuilder {
	private parentsMap: Map<EntityId, BoardNode> = new Map();

	private resultNodes: BoardNode[] = [];

	constructor(parentNode: BoardNode) {
		this.parentsMap.set(parentNode.id, parentNode);
	}

	buildBoardNodes(domainObjects: AnyBoardDo[], parentId?: EntityId): BoardNode[] {
		domainObjects.forEach((domainObject) => domainObject.useBoardNodeBuilder(this, parentId));
		return this.resultNodes;
	}

	buildColumnBoardNode(columnBoard: ColumnBoard): void {
		const columnBoardNode = new ColumnBoardNode({
			id: columnBoard.id,
			title: columnBoard.title,
		});

		this.parentsMap.set(columnBoardNode.id, columnBoardNode);
		this.resultNodes.push(columnBoardNode);
		this.buildChildren(columnBoard.columns, columnBoardNode.id);
	}

	buildColumnNode(column: Column, parentId: EntityId): void {
		const parent = this.parentsMap.get(parentId);

		// this.ensureBoardNodeType(parent, BoardNodeType.COLUMN_BOARD);

		const columnNode = new ColumnNode({
			id: column.id,
			title: column.title,
			parent,
		});

		this.parentsMap.set(columnNode.id, columnNode);
		this.resultNodes.push(columnNode);
		this.buildChildren(column.cards, columnNode.id);
	}

	buildCardNode(card: Card, parentId: EntityId): void {
		const parent = this.parentsMap.get(parentId);

		const cardNode = new CardNode({
			id: card.id,
			height: card.height,
			title: card.title,
			parent,
		});

		this.parentsMap.set(cardNode.id, cardNode);
		this.resultNodes.push(cardNode);
		this.buildChildren(card.elements, cardNode.id);
	}

	buildTextElementNode(textElement: TextElement, parentId: EntityId): void {
		const parent = this.parentsMap.get(parentId);

		const textElementNode = new TextElementNode({
			id: textElement.id,
			text: textElement.text,
			parent,
		});

		this.parentsMap.set(textElementNode.id, textElementNode);
		this.resultNodes.push(textElementNode);
	}

	buildChildren(children: AnyBoardDo[], parentId: EntityId): void {
		children.forEach((domainObject) => domainObject.useBoardNodeBuilder(this, parentId));
	}
}
