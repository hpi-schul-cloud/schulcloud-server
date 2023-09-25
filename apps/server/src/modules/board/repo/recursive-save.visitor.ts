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
import { ContextExternalToolEntity } from '@src/modules/tool/context-external-tool/entity';
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

	visitFileElement(fileElement: FileElement): void {
		const parentData = this.parentsMap.get(fileElement.id);

		const boardNode = new FileElementNode({
			id: fileElement.id,
			caption: fileElement.caption,
			alternativeText: fileElement.alternativeText,
			parent: parentData?.boardNode,
			position: parentData?.position,
		});

		this.createOrUpdateBoardNode(boardNode);
		this.visitChildren(fileElement, boardNode);
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

		this.createOrUpdateBoardNode(boardNode);
		this.visitChildren(richTextElement, boardNode);
	}

	visitSubmissionContainerElement(submissionContainerElement: SubmissionContainerElement): void {
		const parentData = this.parentsMap.get(submissionContainerElement.id);

		const boardNode = new SubmissionContainerElementNode({
			id: submissionContainerElement.id,
			dueDate: submissionContainerElement.dueDate,
			parent: parentData?.boardNode,
			position: parentData?.position,
		});

		this.createOrUpdateBoardNode(boardNode);
		this.visitChildren(submissionContainerElement, boardNode);
	}

	visitSubmissionItem(submission: SubmissionItem): void {
		const parentData = this.parentsMap.get(submission.id);
		const boardNode = new SubmissionItemNode({
			id: submission.id,
			parent: parentData?.boardNode,
			position: parentData?.position,
			completed: submission.completed,
			userId: submission.userId,
		});

		this.createOrUpdateBoardNode(boardNode);
		this.visitChildren(submission, boardNode);
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
