import { Utils } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mongodb';
import { Card } from '@shared/domain/domainobject/board/card.do';
import { ColumnBoard } from '@shared/domain/domainobject/board/column-board.do';
import { Column } from '@shared/domain/domainobject/board/column.do';
import { ExternalToolElement } from '@shared/domain/domainobject/board/external-tool-element.do';
import { FileElement } from '@shared/domain/domainobject/board/file-element.do';
import { LinkElement } from '@shared/domain/domainobject/board/link-element.do';
import { RichTextElement } from '@shared/domain/domainobject/board/rich-text-element.do';
import { SubmissionContainerElement } from '@shared/domain/domainobject/board/submission-container-element.do';
import { SubmissionItem } from '@shared/domain/domainobject/board/submission-item.do';
import { AnyBoardDo } from '@shared/domain/domainobject/board/types/any-board-do';
import { BoardCompositeVisitor } from '@shared/domain/domainobject/board/types/board-composite-visitor';
import { BoardNode } from '@shared/domain/entity/boardnode/boardnode.entity';
import { CardNode } from '@shared/domain/entity/boardnode/card-node.entity';
import { ColumnBoardNode } from '@shared/domain/entity/boardnode/column-board-node.entity';
import { ColumnNode } from '@shared/domain/entity/boardnode/column-node.entity';
import { ExternalToolElementNodeEntity } from '@shared/domain/entity/boardnode/external-tool-element-node.entity';
import { FileElementNode } from '@shared/domain/entity/boardnode/file-element-node.entity';
import { LinkElementNode } from '@shared/domain/entity/boardnode/link-element-node.entity';
import { RichTextElementNode } from '@shared/domain/entity/boardnode/rich-text-element-node.entity';
import { SubmissionContainerElementNode } from '@shared/domain/entity/boardnode/submission-container-element-node.entity';
import { SubmissionItemNode } from '@shared/domain/entity/boardnode/submission-item-node.entity';
import { EntityId } from '@shared/domain/types/entity-id';
import { ContextExternalToolEntity } from '@src/modules/tool/context-external-tool/entity/context-external-tool.entity';
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

		this.createOrUpdateBoardNode(boardNode);
		this.visitChildren(richTextElement, boardNode);
	}

	visitSubmissionContainerElement(submissionContainerElement: SubmissionContainerElement): void {
		const parentData = this.parentsMap.get(submissionContainerElement.id);

		const boardNode = new SubmissionContainerElementNode({
			id: submissionContainerElement.id,
			parent: parentData?.boardNode,
			position: parentData?.position,
			dueDate: submissionContainerElement.dueDate,
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
