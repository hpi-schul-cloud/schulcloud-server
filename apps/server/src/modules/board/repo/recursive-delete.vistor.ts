import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import {
	AnyBoardDo,
	BoardCompositeVisitorAsync,
	BoardNode,
	Card,
	Column,
	ColumnBoard,
	FileElement,
	RichTextElement,
	SubmissionBoard,
	SubmissionContainerElement,
	SubmissionSubElement,
} from '@shared/domain';
import { FilesStorageClientAdapterService } from '@src/modules/files-storage-client';

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

	async visitRichTextElementAsync(richTextElement: RichTextElement): Promise<void> {
		this.deleteNode(richTextElement);
		await this.visitChildrenAsync(richTextElement);
	}

	async visitSubmissionContainerElementAsync(submissionContainerElement: SubmissionContainerElement): Promise<void> {
		this.deleteNode(submissionContainerElement);
		await this.visitChildrenAsync(submissionContainerElement);
	}

	async visitSubmissionSubElementAsync(submissionSubElement: SubmissionSubElement): Promise<void> {
		this.deleteNode(submissionSubElement);
		await this.visitChildrenAsync(submissionSubElement);
	}

	async visitSubmissionAsync(submission: SubmissionBoard): Promise<void> {
		this.deleteNode(submission);
		await this.visitChildrenAsync(submission);
	}

	deleteNode(domainObject: AnyBoardDo): void {
		this.em.remove(this.em.getReference(BoardNode, domainObject.id));
	}

	async visitChildrenAsync(domainObject: AnyBoardDo): Promise<void> {
		await Promise.all(domainObject.children.map(async (child) => child.acceptAsync(this)));
	}
}
