import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
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
import { BoardCompositeVisitorAsync } from '@shared/domain/domainobject/board/types/board-composite-visitor';
import { BoardNode } from '@shared/domain/entity/boardnode/boardnode.entity';
import { FilesStorageClientAdapterService } from '@src/modules/files-storage-client/service/files-storage-client.service';

@Injectable()
export class RecursiveDeleteVisitor implements BoardCompositeVisitorAsync {
	constructor(
		private readonly em: EntityManager,
		private readonly filesStorageClientAdapterService: FilesStorageClientAdapterService
	) {}

	async visitColumnBoardAsync(columnBoard: ColumnBoard): Promise<void> {
		this.deleteNode(columnBoard);
		await this.visitChildrenAsync(columnBoard);
	}

	async visitColumnAsync(column: Column): Promise<void> {
		this.deleteNode(column);
		await this.visitChildrenAsync(column);
	}

	async visitCardAsync(card: Card): Promise<void> {
		this.deleteNode(card);
		await this.visitChildrenAsync(card);
	}

	async visitFileElementAsync(fileElement: FileElement): Promise<void> {
		await this.filesStorageClientAdapterService.deleteFilesOfParent(fileElement.id);
		this.deleteNode(fileElement);

		await this.visitChildrenAsync(fileElement);
	}

	async visitLinkElementAsync(linkElement: LinkElement): Promise<void> {
		this.deleteNode(linkElement);

		await this.visitChildrenAsync(linkElement);
	}

	async visitRichTextElementAsync(richTextElement: RichTextElement): Promise<void> {
		this.deleteNode(richTextElement);
		await this.visitChildrenAsync(richTextElement);
	}

	async visitSubmissionContainerElementAsync(submissionContainerElement: SubmissionContainerElement): Promise<void> {
		this.deleteNode(submissionContainerElement);
		await this.visitChildrenAsync(submissionContainerElement);
	}

	async visitSubmissionItemAsync(submission: SubmissionItem): Promise<void> {
		this.deleteNode(submission);
		await this.visitChildrenAsync(submission);
	}

	async visitExternalToolElementAsync(externalToolElement: ExternalToolElement): Promise<void> {
		// TODO N21-1296: Delete linked ContextExternalTool
		this.deleteNode(externalToolElement);

		await this.visitChildrenAsync(externalToolElement);
	}

	deleteNode(domainObject: AnyBoardDo): void {
		this.em.remove(this.em.getReference(BoardNode, domainObject.id));
	}

	async visitChildrenAsync(domainObject: AnyBoardDo): Promise<void> {
		await Promise.all(domainObject.children.map(async (child) => child.acceptAsync(this)));
	}
}
