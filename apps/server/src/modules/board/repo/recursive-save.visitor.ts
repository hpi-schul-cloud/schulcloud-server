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
	ExternalToolElement,
	ExternalToolElementNodeEntity,
	FileElement,
	FileElementNode,
	RichTextElement,
	RichTextElementNode,
	SubmissionContainerElement,
	SubmissionContainerElementNode,
	SubmissionItem,
	SubmissionItemNode,
} from '@shared/domain';
import { LinkElement } from '@shared/domain/domainobject/board/link-element.do';
import { LinkElementNode } from '@shared/domain/entity/boardnode/link-element-node.entity';
import { ContextExternalToolEntity } from '@modules/tool/context-external-tool/entity';
import { DrawingElement } from '@shared/domain/domainobject/board/drawing-element.do';
import { DrawingElementNode } from '@shared/domain/entity/boardnode/drawing-element-node.entity';
import { BoardNodeRepo } from './board-node.repo';

type ParentData = {
	boardNode: BoardNode;
	position: number;
};

export class RecursiveSaveVisitor implements BoardCompositeVisitor {
	private parentsMap: Map<EntityId, ParentData> = new Map();

	constructor(private readonly em: EntityManager, private readonly boardNodeRepo: BoardNodeRepo) {}

	async save(domainObject: AnyBoardDo | AnyBoardDo[], parent?: AnyBoardDo): Promise<void> {
		const domainObjects = Utils.asArray(domainObject);

		if (parent) {
			const parentNode = await this.boardNodeRepo.findById(parent.id);

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
			context: columnBoard.context,
		});

		this.saveRecursive(boardNode, columnBoard);
	}

	visitColumn(column: Column): void {
		const parentData = this.parentsMap.get(column.id);

		const boardNode = new ColumnNode({
			id: column.id,
			title: column.title,
			parent: parentData?.boardNode,
			position: parentData?.position,
		});

		this.saveRecursive(boardNode, column);
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

		this.saveRecursive(boardNode, card);
	}

	visitFileElement(fileElement: FileElement): void {
		const parentData = this.parentsMap.get(fileElement.id);

		const boardNode = new FileElementNode({
			id: fileElement.id,
			caption: fileElement.caption,
			alternativeText: fileElement.alternativeText,
			parent: parentData?.boardNode,
			position: parentData?.position,
		});

		this.saveRecursive(boardNode, fileElement);
	}

	visitLinkElement(linkElement: LinkElement): void {
		const parentData = this.parentsMap.get(linkElement.id);

		const boardNode = new LinkElementNode({
			id: linkElement.id,
			url: linkElement.url,
			title: linkElement.title,
			imageUrl: linkElement.imageUrl,
			parent: parentData?.boardNode,
			position: parentData?.position,
		});

		this.createOrUpdateBoardNode(boardNode);
		this.visitChildren(linkElement, boardNode);
	}

	visitRichTextElement(richTextElement: RichTextElement): void {
		const parentData = this.parentsMap.get(richTextElement.id);

		const boardNode = new RichTextElementNode({
			id: richTextElement.id,
			text: richTextElement.text,
			inputFormat: richTextElement.inputFormat,
			parent: parentData?.boardNode,
			position: parentData?.position,
		});

		this.saveRecursive(boardNode, richTextElement);
	}

	visitDrawingElement(drawingElement: DrawingElement): void {
		const parentData = this.parentsMap.get(drawingElement.id);

		const boardNode = new DrawingElementNode({
			id: drawingElement.id,
			description: drawingElement.description ?? '',
			parent: parentData?.boardNode,
			position: parentData?.position,
		});

		this.saveRecursive(boardNode, drawingElement);
	}

	visitSubmissionContainerElement(submissionContainerElement: SubmissionContainerElement): void {
		const parentData = this.parentsMap.get(submissionContainerElement.id);

		const boardNode = new SubmissionContainerElementNode({
			id: submissionContainerElement.id,
			parent: parentData?.boardNode,
			position: parentData?.position,
			dueDate: submissionContainerElement.dueDate,
		});

		this.saveRecursive(boardNode, submissionContainerElement);
	}

	visitSubmissionItem(submissionItem: SubmissionItem): void {
		const parentData = this.parentsMap.get(submissionItem.id);
		const boardNode = new SubmissionItemNode({
			id: submissionItem.id,
			parent: parentData?.boardNode,
			position: parentData?.position,
			completed: submissionItem.completed,
			userId: submissionItem.userId,
		});

		this.saveRecursive(boardNode, submissionItem);
	}

	visitExternalToolElement(externalToolElement: ExternalToolElement): void {
		const parentData: ParentData | undefined = this.parentsMap.get(externalToolElement.id);

		const boardNode: ExternalToolElementNodeEntity = new ExternalToolElementNodeEntity({
			id: externalToolElement.id,
			contextExternalTool: externalToolElement.contextExternalToolId
				? this.em.getReference(ContextExternalToolEntity, externalToolElement.contextExternalToolId)
				: undefined,
			parent: parentData?.boardNode,
			position: parentData?.position,
		});

		this.createOrUpdateBoardNode(boardNode);
		this.visitChildren(externalToolElement, boardNode);
	}

	private visitChildren(parent: AnyBoardDo, parentNode: BoardNode) {
		parent.children.forEach((child) => {
			this.registerParentData(parent, child, parentNode);
			child.accept(this);
		});
	}

	private registerParentData(parent: AnyBoardDo, child: AnyBoardDo, parentNode: BoardNode) {
		const position = parent.children.findIndex((obj) => obj.id === child.id);
		if (position === -1) {
			throw new Error(`Cannot get child position. Child doesnt belong to parent`);
		}
		this.parentsMap.set(child.id, { boardNode: parentNode, position });
	}

	private saveRecursive(boardNode: BoardNode, anyBoardDo: AnyBoardDo): void {
		this.createOrUpdateBoardNode(boardNode);
		this.visitChildren(anyBoardDo, boardNode);
	}

	// TODO make private (change tests)
	createOrUpdateBoardNode(boardNode: BoardNode): void {
		const existing = this.em.getUnitOfWork().getById<BoardNode>(BoardNode.name, boardNode.id);
		if (existing) {
			this.em.assign(existing, boardNode);
		} else {
			this.em.persist(boardNode);
		}
	}
}
