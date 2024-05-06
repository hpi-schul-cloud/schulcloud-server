import { Injectable } from '@nestjs/common';
import { sanitizeRichText } from '@shared/controller';
import {
	AnyElementContentBody,
	DrawingContentBody,
	ExternalToolContentBody,
	FileContentBody,
	LinkContentBody,
	RichTextContentBody,
	SubmissionContainerContentBody,
} from '../../controller/dto';
import {
	AnyContentElement,
	DrawingElement,
	ExternalToolElement,
	FileElement,
	InputFormat,
	isDrawingElement,
	isExternalToolElement,
	isFileElement,
	isLinkElement,
	isRichTextElement,
	isSubmissionContainerElement,
	LinkElement,
	RichTextElement,
	SubmissionContainerElement,
} from '../domain';

@Injectable()
export class ContentElementUpdateService {
	updateContent(element: AnyContentElement, content: AnyElementContentBody): void {
		// TODO refactor if ... else to e.g. discriminated union
		if (isFileElement(element) && content instanceof FileContentBody) {
			this.updateFileElement(element, content);
		} else if (isLinkElement(element) && content instanceof LinkContentBody) {
			this.updateLinkElement(element, content);
		} else if (isRichTextElement(element) && content instanceof RichTextContentBody) {
			this.updateRichTextElement(element, content);
		} else if (isDrawingElement(element) && content instanceof DrawingContentBody) {
			this.updateDrawingElement(element, content);
		} else if (isSubmissionContainerElement(element) && content instanceof SubmissionContainerContentBody) {
			this.updateSubmissionContainerElement(element, content);
		} else if (isExternalToolElement(element) && content instanceof ExternalToolContentBody) {
			this.updateExternalToolElement(element, content);
		} else {
			throw new Error(`Cannot update element of type: '${element.constructor.name}'`);
		}
	}

	updateFileElement(element: FileElement, content: FileContentBody): void {
		element.caption = sanitizeRichText(content.caption, InputFormat.PLAIN_TEXT);
		element.alternativeText = sanitizeRichText(content.alternativeText, InputFormat.PLAIN_TEXT);
	}

	updateLinkElement(element: LinkElement, content: LinkContentBody): void {
		element.url = new URL(content.url).toString();
		element.title = content.title ?? '';
		element.description = content.description ?? '';
		if (content.imageUrl) {
			const isRelativeUrl = (url: string) => {
				const fallbackHostname = 'https://www.fallback-url-if-url-is-relative.org';
				const imageUrlObject = new URL(url, fallbackHostname);
				return imageUrlObject.origin === fallbackHostname;
			};

			if (isRelativeUrl(content.imageUrl)) {
				element.imageUrl = content.imageUrl;
			}
		}
	}

	updateRichTextElement(element: RichTextElement, content: RichTextContentBody): void {
		element.text = sanitizeRichText(content.text, content.inputFormat);
		element.inputFormat = content.inputFormat;
	}

	updateDrawingElement(element: DrawingElement, content: DrawingContentBody): void {
		element.description = content.description;
	}

	updateSubmissionContainerElement(element: SubmissionContainerElement, content: SubmissionContainerContentBody): void {
		if (content.dueDate !== undefined) {
			element.dueDate = content.dueDate;
		}
	}

	updateExternalToolElement(element: ExternalToolElement, content: ExternalToolContentBody): void {
		if (content.contextExternalToolId !== undefined) {
			// Updates should not remove an existing reference to a tool, to prevent orphan tool instances
			element.contextExternalToolId = content.contextExternalToolId;
		}
	}
}
