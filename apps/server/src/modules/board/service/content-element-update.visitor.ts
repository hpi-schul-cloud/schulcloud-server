import { Injectable } from '@nestjs/common';
import { sanitizeRichText } from '@shared/controller';
import {
	AnyBoardDo,
	BoardCompositeVisitorAsync,
	Card,
	Column,
	ColumnBoard,
	ExternalToolElement,
	FileElement,
	InputFormat,
	RichTextElement,
	SubmissionContainerElement,
	SubmissionItem,
} from '@shared/domain';
import { DrawingElement } from '@shared/domain/domainobject/board/drawing-element.do';
import { LinkElement } from '@shared/domain/domainobject/board/link-element.do';
import {
	AnyElementContentBody,
	DrawingContentBody,
	ExternalToolContentBody,
	FileContentBody,
	LinkContentBody,
	RichTextContentBody,
	SubmissionContainerContentBody,
} from '../controller/dto';
import { OpenGraphProxyService } from './open-graph-proxy.service';

@Injectable()
export class ContentElementUpdateVisitor implements BoardCompositeVisitorAsync {
	private readonly content: AnyElementContentBody;

	constructor(content: AnyElementContentBody, private readonly openGraphProxyService: OpenGraphProxyService) {
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
			const urlWithProtocol = /:\/\//.test(this.content.url) ? this.content.url : `https://${this.content.url}`;
			linkElement.url = new URL(urlWithProtocol).toString();
			const openGraphData = await this.openGraphProxyService.fetchOpenGraphData(linkElement.url);
			linkElement.title = openGraphData.title;
			linkElement.description = openGraphData.description;
			if (openGraphData.image) {
				linkElement.imageUrl = openGraphData.image.url;
			}
			return Promise.resolve();
		}
		return this.rejectNotHandled(linkElement);
	}

	async visitRichTextElementAsync(richTextElement: RichTextElement): Promise<void> {
		if (this.content instanceof RichTextContentBody) {
			richTextElement.text = sanitizeRichText(this.content.text, this.content.inputFormat);
			richTextElement.inputFormat = this.content.inputFormat;
			return Promise.resolve();
		}
		return this.rejectNotHandled(richTextElement);
	}

	async visitDrawingElementAsync(drawingElement: DrawingElement): void {
		if (this.content instanceof DrawingContentBody) {
			drawingElement.drawingName = this.content.drawingName;
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

	private rejectNotHandled(component: AnyBoardDo): Promise<void> {
		return Promise.reject(new Error(`Cannot update element of type: '${component.constructor.name}'`));
	}
}
