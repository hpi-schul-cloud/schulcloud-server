import { AnyBoardDo, Card, Column, ColumnBoard, TextElement } from '@shared/domain/domainobject';
import { BoardRepo } from '@shared/repo';
import { BoardNodeBuilder } from '../../domainobject/board/types/board-node-builder';
import { BoardNode } from './boardnode.entity';
import { CardNode } from './card-node.entity';
import { ColumnBoardNode } from './column-board-node.entity';
import { ColumnNode } from './column-node.entity';
import { TextElementNode } from './text-element-node.entity';
import { BoardNodeType } from './types';

export class BoardNodeBuilderImpl implements BoardNodeBuilder {
	private initializedParent: BoardNode;

	private skipChildren: boolean;

	constructor(ancestors: AnyBoardDo[], skipChildren = false) {
		this.skipChildren = skipChildren;
		if (this.skipChildren === false) {
			this.initializedParent = this.getParentNode(ancestors);
		}
	}

	private getParentNode(ancestors: AnyBoardDo[]): BoardNode[] {
		const ancestorBoardNodeBuilder = new BoardNodeBuilderImpl(ancestors, true);
		let parent: BoardNode;
		for (const ancestor of ancestors) {
			parent = ancestor.useBoardNodeBuilder(ancestorBoardNodeBuilder, parent)[0];
		}
		return parent;
	}

	buildColumnBoardNode(columnBoard: ColumnBoard, parent?: BoardNode): BoardNode[] {
		const columnBoardNode = new ColumnBoardNode({
			id: columnBoard.id,
			title: columnBoard.title,
			type: BoardNodeType.COLUMN_BOARD,
			parent,
		});

		const children = columnBoard.columns ? this.buildChildren(columnBoard.columns) : [];
		return [columnBoardNode, ...children];
	}

	buildColumnNode(column: Column, parent: BoardNode): BoardNode[] {
		const columnNode = new ColumnNode({
			id: column.id,
			title: column.title,
			type: BoardNodeType.COLUMN,
			parent,
		});

		const children = column.cards ? this.buildChildren(column.cards) : [];
		return [columnNode, ...children];
	}

	buildCardNode(card: Card, parent?: BoardNode): BoardNode[] {
		const usedParent = parent ? parent : this.initializedParent;
		const cardNode = new CardNode({
			id: card.id,
			height: card.height,
			type: BoardNodeType.CARD,
			title: card.title,
			parent: usedParent,
		});

		const children = card.elements ? this.buildChildren(card.elements, cardNode) : [];
		return [cardNode, ...children];
	}

	buildTextElementNode(textElement: TextElement, parent: BoardNode): BoardNode[] {
		const textElementNode = new TextElementNode({
			id: textElement.id,
			type: BoardNodeType.TEXT_ELEMENT,
			text: textElement.text,
			parent,
		});
		return [textElementNode];
	}

	buildChildren(children: AnyBoardDo[], parent): BoardNode[] {
		const childNodes = this.skipChildren
			? []
			: children.map((domainObject) => domainObject.useBoardNodeBuilder(this, parent)).flat();
		return childNodes;
	}

	// fake UC
	createCard(userid, boardId, columnId, title, position) {
		const card = new Card({ title });
		const board = boardRepo.findById(boardId);
		const column = board.columns.find((c) => c.id === columnId);
		column.cards.splice(position, 0, card);

		const ancestors = [board, column];

		BoardRepo.saveCards(column.cards, ancestors);
	}

	// specialized persistence method
	BoardRepo_saveCards(cards: Card[], columnId: EntityId[]) {
		const columnNode = boardNodeRepo.findById(columnId);
		const builder = new BoardNodeBuilderImpl(ancestors);

		for (const card of cards) {
			builder.buildCardNode(card, columnNode);
		}
	}
}

// ein BoardNode interessiert sich nur für seinen Parent und nicht für seine Children (anders als bei den DOs)
// das repo interessiert sich bei Speicheroperationen auch für die Children
