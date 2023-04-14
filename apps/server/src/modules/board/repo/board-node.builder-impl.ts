import { NotFoundException } from '@nestjs/common';
import {
	AnyBoardDo,
	BoardNode,
	BoardNodeBuilder,
	BoardNodeType,
	Card,
	CardNode,
	Column,
	ColumnBoard,
	ColumnBoardNode,
	ColumnNode,
	EntityId,
	FileElement,
	FileElementNode,
	TextElement,
	TextElementNode,
} from '@shared/domain';

export class BoardNodeBuilderImpl implements BoardNodeBuilder {
	private parentsMap: Map<EntityId, BoardNode> = new Map();

	private resultNodes: BoardNode[] = [];

	constructor(parentNode?: BoardNode) {
		if (parentNode) {
			this.parentsMap.set(parentNode.id, parentNode);
		}
	}

	buildBoardNodes(domainObjects: AnyBoardDo[], parent?: AnyBoardDo): BoardNode[] {
		this.buildChildren(domainObjects, parent);
		return this.resultNodes;
	}

	buildColumnBoardNode(columnBoard: ColumnBoard, parent?: AnyBoardDo): void {
		const parentNode = this.getParentNode(parent?.id);

		const columnBoardNode = new ColumnBoardNode({
			id: columnBoard.id,
			title: columnBoard.title,
			parent: parentNode,
			position: this.getChildPosition(columnBoard, parent),
		});
		this.registerNode(columnBoardNode);

		this.buildChildren(columnBoard.children, columnBoard);
	}

	buildColumnNode(column: Column, parent?: AnyBoardDo): void {
		const parentNode = this.getParentNode(parent?.id);
		this.ensureBoardNodeType(parentNode, BoardNodeType.COLUMN_BOARD);

		const columnNode = new ColumnNode({
			id: column.id,
			title: column.title,
			parent: parentNode,
			position: this.getChildPosition(column, parent),
		});
		this.registerNode(columnNode);

		this.buildChildren(column.children, column);
	}

	buildCardNode(card: Card, parent?: AnyBoardDo): void {
		const parentNode = this.getParentNode(parent?.id);
		this.ensureBoardNodeType(parentNode, BoardNodeType.COLUMN);

		const cardNode = new CardNode({
			id: card.id,
			height: card.height,
			title: card.title,
			parent: parentNode,
			position: this.getChildPosition(card, parent),
		});
		this.registerNode(cardNode);

		this.buildChildren(card.children, card);
	}

	buildTextElementNode(textElement: TextElement, parent?: AnyBoardDo): void {
		const parentNode = this.getParentNode(parent?.id);
		this.ensureBoardNodeType(parentNode, BoardNodeType.CARD);

		const textElementNode = new TextElementNode({
			id: textElement.id,
			text: textElement.text,
			parent: parentNode,
			position: this.getChildPosition(textElement, parent),
		});
		this.registerNode(textElementNode);
	}

	buildFileElementNode(fileElement: FileElement, parent?: AnyBoardDo): void {
		const parentNode = this.getParentNode(parent?.id);
		this.ensureBoardNodeType(parentNode, BoardNodeType.CARD);

		const fileElementNode = new FileElementNode({
			id: fileElement.id,
			description: fileElement.description,
			parent: parentNode,
			position: this.getChildPosition(fileElement, parent),
		});
		this.registerNode(fileElementNode);
	}

	registerNode(boardNode: BoardNode) {
		this.parentsMap.set(boardNode.id, boardNode);
		this.resultNodes.push(boardNode);
	}

	getParentNode(parentId?: EntityId): BoardNode | undefined {
		const parent = parentId ? this.parentsMap.get(parentId) : undefined;
		return parent;
	}

	getChildPosition(child: AnyBoardDo, parent?: AnyBoardDo): number | undefined {
		if (parent) {
			const position = parent.children.findIndex((o) => o.id === child.id);
			return position === -1 ? undefined : position;
		}
		return undefined;
	}

	isChildOfParent(child: AnyBoardDo, parent: AnyBoardDo): boolean {
		const exists = parent.children.some((o) => o.id === child.id);
		return exists;
	}

	ensureBoardNodeType(boardNode: BoardNode | undefined, ...allowedBoardNodeTypes: BoardNodeType[]) {
		if (boardNode && !allowedBoardNodeTypes.includes(boardNode.type)) {
			throw new Error(`board node type is not allowed: >${boardNode.type}<`);
		}
	}

	ensureHasChild(child: AnyBoardDo, parent?: AnyBoardDo) {
		if (parent && !this.isChildOfParent(child, parent)) {
			throw new NotFoundException('child is not child of this parent');
		}
	}

	buildChildren(children: AnyBoardDo[], parent?: AnyBoardDo): void {
		children.forEach((domainObject) => {
			this.ensureHasChild(domainObject, parent);
			domainObject.useBoardNodeBuilder(this, parent);
		});
	}
}
