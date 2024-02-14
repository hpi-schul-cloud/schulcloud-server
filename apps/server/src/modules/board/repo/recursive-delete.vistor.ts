import { EntityManager } from '@mikro-orm/mongodb';
import { FilesStorageClientAdapterService } from '@modules/files-storage-client';
import { ContextExternalTool } from '@modules/tool/context-external-tool/domain';
import { ContextExternalToolService } from '@modules/tool/context-external-tool/service';
import { Injectable } from '@nestjs/common';
import {
	AnyBoardDo,
	BoardCompositeVisitorAsync,
	Card,
	Column,
	ColumnBoard,
	ExternalToolElement,
	FileElement,
	RichTextElement,
	SubmissionContainerElement,
	SubmissionItem,
} from '@shared/domain/domainobject';
import { DrawingElement } from '@shared/domain/domainobject/board/drawing-element.do';
import { LinkElement } from '@shared/domain/domainobject/board/link-element.do';
import { BoardNode } from '@shared/domain/entity';
import { DrawingElementAdapterService } from '@modules/tldraw-client';

@Injectable()
export class RecursiveDeleteVisitor implements BoardCompositeVisitorAsync {
	constructor(
		private readonly em: EntityManager,
		private readonly filesStorageClientAdapterService: FilesStorageClientAdapterService,
		private readonly contextExternalToolService: ContextExternalToolService,
		private readonly drawingElementAdapterService: DrawingElementAdapterService
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
		await this.filesStorageClientAdapterService.deleteFilesOfParent(linkElement.id);
		this.deleteNode(linkElement);

		await this.visitChildrenAsync(linkElement);
	}

	async visitRichTextElementAsync(richTextElement: RichTextElement): Promise<void> {
		this.deleteNode(richTextElement);
		await this.visitChildrenAsync(richTextElement);
	}

	async visitDrawingElementAsync(drawingElement: DrawingElement): Promise<void> {
		await this.drawingElementAdapterService.deleteDrawingBinData(drawingElement.id);
		await this.filesStorageClientAdapterService.deleteFilesOfParent(drawingElement.id);

		this.deleteNode(drawingElement);
		await this.visitChildrenAsync(drawingElement);
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
		if (externalToolElement.contextExternalToolId) {
			const linkedTool: ContextExternalTool | null = await this.contextExternalToolService.findById(
				externalToolElement.contextExternalToolId
			);

			if (linkedTool) {
				await this.contextExternalToolService.deleteContextExternalTool(linkedTool);
			}
		}

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
