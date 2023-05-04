import { Utils } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mongodb';
import {
	AnyBoardDo,
	BoardCompositeVisitor,
	BoardNode,
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

type ParentData = {
	boardNode: BoardNode;
	position: number;
};

export class RecursiveSaveVisitor implements BoardCompositeVisitor {
	private parentsMap: Map<EntityId, ParentData> = new Map();

	constructor(private readonly em: EntityManager) {}

	async save(domainObject: AnyBoardDo | AnyBoardDo[], parent?: AnyBoardDo): Promise<void> {
		const domainObjects = Utils.asArray(domainObject);

		if (parent) {
			const parentNode = await this.em.findOneOrFail(BoardNode, parent.id);

			domainObjects.forEach((child) => {
				this.registerParentData(parent, child, parentNode);
			});
		}

		domainObjects.forEach((child) => child.accept(this));
	}

	visitColumnBoard(columnBoard: ColumnBoard): void {
		const parentData = this.parentsMap.get(columnBoard.id);

		const boardNode = new ColumnBoardNode({
			id: columnBoard.id,
			title: columnBoard.title,
			parent: parentData?.boardNode,
			position: parentData?.position,
		});

		this.createOrUpdateBoardNode(boardNode);
		this.visitChildren(columnBoard, boardNode);
	}

	visitColumn(column: Column): void {
		const parentData = this.parentsMap.get(column.id);

		const boardNode = new ColumnNode({
			id: column.id,
			title: column.title,
			parent: parentData?.boardNode,
			position: parentData?.position,
		});

		this.createOrUpdateBoardNode(boardNode);
		this.visitChildren(column, boardNode);
	}

	visitCard(card: Card): void {
		const parentData = this.parentsMap.get(card.id);

		const boardNode = new CardNode({
			id: card.id,
			height: card.height,
			title: card.title,
			parent: parentData?.boardNode,
			position: parentData?.position,
		});

		this.createOrUpdateBoardNode(boardNode);
		this.visitChildren(card, boardNode);
	}

	visitTextElement(textElement: TextElement): void {
		const parentData = this.parentsMap.get(textElement.id);

		const boardNode = new TextElementNode({
			id: textElement.id,
			text: textElement.text,
			parent: parentData?.boardNode,
			position: parentData?.position,
		});

		this.createOrUpdateBoardNode(boardNode);
		this.visitChildren(textElement, boardNode);
	}

	visitFileElement(fileElement: FileElement): void {
		const parentData = this.parentsMap.get(fileElement.id);

		const boardNode = new FileElementNode({
			id: fileElement.id,
			caption: fileElement.caption,
			parent: parentData?.boardNode,
			position: parentData?.position,
		});

		this.createOrUpdateBoardNode(boardNode);
		this.visitChildren(fileElement, boardNode);
	}

	visitChildren(parent: AnyBoardDo, parentNode: BoardNode) {
		parent.children.forEach((child) => {
			this.registerParentData(parent, child, parentNode);
			child.accept(this);
		});
	}

	registerParentData(parent: AnyBoardDo, child: AnyBoardDo, parentNode: BoardNode) {
		const position = parent.children.findIndex((obj) => obj.id === child.id);
		if (position === -1) {
			throw new Error(`Cannot get child position. Child doesnt belong to parent`);
		}
		this.parentsMap.set(child.id, { boardNode: parentNode, position });
	}

	createOrUpdateBoardNode(boardNode: BoardNode): void {
		const existing = this.em.getUnitOfWork().getById<BoardNode>(BoardNode.name, boardNode.id);
		if (existing) {
			this.em.assign(existing, boardNode);
		} else {
			this.em.persist(boardNode);
		}
	}
}
