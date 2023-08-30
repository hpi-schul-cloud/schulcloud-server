import { sanitizeRichText } from '@shared/controller';
import {
	AnyBoardDo,
	BoardCompositeVisitor,
	Card,
	Column,
	ColumnBoard,
	FileElement,
	RichTextElement,
	SubmissionContainerElement,
	SubmissionItem,
} from '@shared/domain';
import { DrawingElement } from '@shared/domain/domainobject/board/drawing-element.do';
import {
	DrawingContentBody,
	FileContentBody,
	RichTextContentBody,
	SubmissionContainerContentBody,
} from '../controller/dto';

type ContentType = FileContentBody | RichTextContentBody | DrawingContentBody | SubmissionContainerContentBody;

export class ContentElementUpdateVisitor implements BoardCompositeVisitor {
	private readonly content: ContentType;

	constructor(content: ContentType) {
		this.content = content;
	}

	visitColumnBoard(columnBoard: ColumnBoard): void {
		this.throwNotHandled(columnBoard);
	}

	visitColumn(column: Column): void {
		this.throwNotHandled(column);
	}

	visitCard(card: Card): void {
		this.throwNotHandled(card);
	}

	visitFileElement(fileElement: FileElement): void {
		if (this.content instanceof FileContentBody) {
			fileElement.caption = this.content.caption;
		} else {
			this.throwNotHandled(fileElement);
		}
	}

	visitRichTextElement(richTextElement: RichTextElement): void {
		if (this.content instanceof RichTextContentBody) {
			richTextElement.text = sanitizeRichText(this.content.text, this.content.inputFormat);
			richTextElement.inputFormat = this.content.inputFormat;
		} else {
			this.throwNotHandled(richTextElement);
		}
	}

	visitDrawingElement(drawingElement: DrawingElement): void {
		if (this.content instanceof DrawingContentBody) {
			drawingElement.drawingName = this.content.drawingName;
			drawingElement.description = this.content.description;
		} else {
			this.throwNotHandled(drawingElement);
		}
	}

	visitSubmissionContainerElement(submissionContainerElement: SubmissionContainerElement): void {
		if (this.content instanceof SubmissionContainerContentBody) {
			submissionContainerElement.dueDate = this.content.dueDate;
		} else {
			this.throwNotHandled(submissionContainerElement);
		}
	}

	visitSubmissionItem(submission: SubmissionItem): void {
		this.throwNotHandled(submission);
	}

	private throwNotHandled(component: AnyBoardDo) {
		throw new Error(`Cannot update element of type: '${component.constructor.name}'`);
	}
}
