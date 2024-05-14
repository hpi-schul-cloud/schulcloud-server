import { Injectable } from '@nestjs/common';
import { sanitizeRichText } from '@shared/controller';
import type {
	AnyBoardDo,
	BoardCompositeVisitorAsync,
	Card,
	Column,
	ColumnBoard,
	ExternalToolElement,
	FileElement,
	MediaBoard,
	MediaExternalToolElement,
	MediaLine,
	RichTextElement,
	SubmissionContainerElement,
	SubmissionItem,
} from '@shared/domain/domainobject';
import { CollaborativeTextEditorElement } from '@shared/domain/domainobject/board/collaborative-text-editor-element.do';
import { DrawingElement } from '@shared/domain/domainobject/board/drawing-element.do';
import { LinkElement } from '@shared/domain/domainobject/board/link-element.do';
import { InputFormat } from '@shared/domain/types';
import {
	AnyElementContentBody,
	DrawingContentBody,
	ExternalToolContentBody,
	FileContentBody,
	LinkContentBody,
	RichTextContentBody,
	SubmissionContainerContentBody,
} from '../controller/dto';

@Injectable()
export class ContentElementUpdateVisitor implements BoardCompositeVisitorAsync {
	private readonly content: AnyElementContentBody;

	constructor(content: AnyElementContentBody) {
		this.content = content;
	}

	async visitColumnBoardAsync(columnBoard: ColumnBoard): Promise<void> {
		return this.rejectNotHandled(columnBoard);
	}

	async visitColumnAsync(column: Column): Promise<void> {
		return this.rejectNotHandled(column);
	}

	async visitCardAsync(card: Card): Promise<void> {
		return this.rejectNotHandled(card);
	}

	async visitFileElementAsync(fileElement: FileElement): Promise<void> {
		if (this.content instanceof FileContentBody) {
			fileElement.caption = sanitizeRichText(this.content.caption, InputFormat.PLAIN_TEXT);
			fileElement.alternativeText = sanitizeRichText(this.content.alternativeText, InputFormat.PLAIN_TEXT);
			return Promise.resolve();
		}
		return this.rejectNotHandled(fileElement);
	}

	async visitLinkElementAsync(linkElement: LinkElement): Promise<void> {
		if (this.content instanceof LinkContentBody) {
			linkElement.url = new URL(this.content.url).toString();
			linkElement.title = this.content.title ?? '';
			linkElement.description = this.content.description ?? '';
			if (this.content.imageUrl) {
				const isRelativeUrl = (url: string) => {
					const fallbackHostname = 'https://www.fallback-url-if-url-is-relative.org';
					const imageUrlObject = new URL(url, fallbackHostname);
					return imageUrlObject.origin === fallbackHostname;
				};

				if (isRelativeUrl(this.content.imageUrl)) {
					linkElement.imageUrl = this.content.imageUrl;
				}
			}
			return Promise.resolve();
		}
		return this.rejectNotHandled(linkElement);
	}

	async visitRichTextElementAsync(richTextElement: RichTextElement): Promise<void> {
		console.log('this.content', this.content);
		if (this.content instanceof RichTextContentBody) {
			richTextElement.text = sanitizeRichText(this.content.text, this.content.inputFormat);
			richTextElement.inputFormat = this.content.inputFormat;
			return Promise.resolve();
		}
		return this.rejectNotHandled(richTextElement);
	}

	async visitDrawingElementAsync(drawingElement: DrawingElement): Promise<void> {
		if (this.content instanceof DrawingContentBody) {
			drawingElement.description = this.content.description;
			return Promise.resolve();
		}
		return this.rejectNotHandled(drawingElement);
	}

	async visitSubmissionContainerElementAsync(submissionContainerElement: SubmissionContainerElement): Promise<void> {
		if (this.content instanceof SubmissionContainerContentBody) {
			if (this.content.dueDate !== undefined) {
				submissionContainerElement.dueDate = this.content.dueDate;
			}
			return Promise.resolve();
		}
		return this.rejectNotHandled(submissionContainerElement);
	}

	async visitSubmissionItemAsync(submission: SubmissionItem): Promise<void> {
		return this.rejectNotHandled(submission);
	}

	async visitExternalToolElementAsync(externalToolElement: ExternalToolElement): Promise<void> {
		if (this.content instanceof ExternalToolContentBody && this.content.contextExternalToolId !== undefined) {
			// Updates should not remove an existing reference to a tool, to prevent orphan tool instances
			externalToolElement.contextExternalToolId = this.content.contextExternalToolId;
			return Promise.resolve();
		}
		return this.rejectNotHandled(externalToolElement);
	}

	async visitCollaborativeTextEditorElementAsync(
		collaborativeTextEditorElement: CollaborativeTextEditorElement
	): Promise<void> {
		return this.rejectNotHandled(collaborativeTextEditorElement);
	}

	private rejectNotHandled(component: AnyBoardDo): Promise<void> {
		return Promise.reject(new Error(`Cannot update element of type: '${component.constructor.name}'`));
	}

	visitMediaBoardAsync(mediaBoard: MediaBoard): Promise<void> {
		return this.rejectNotHandled(mediaBoard);
	}

	visitMediaLineAsync(mediaLine: MediaLine): Promise<void> {
		return this.rejectNotHandled(mediaLine);
	}

	visitMediaExternalToolElementAsync(mediaElement: MediaExternalToolElement): Promise<void> {
		return this.rejectNotHandled(mediaElement);
	}
}
