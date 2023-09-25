import { DrawingElement } from '../drawing-element.do';
import { ExternalToolElement } from '../external-tool-element.do';
import { FileElement } from '../file-element.do';
import { RichTextElement } from '../rich-text-element.do';
import { SubmissionContainerElement } from '../submission-container-element.do';
import type { AnyBoardDo } from './any-board-do';

export type AnyContentElementDo =
	| FileElement
	| RichTextElement
	| SubmissionContainerElement
	| ExternalToolElement
	| DrawingElement;

export const isAnyContentElement = (element: AnyBoardDo): element is AnyContentElementDo => {
	const result =
		element instanceof FileElement ||
		element instanceof RichTextElement ||
		element instanceof SubmissionContainerElement ||
		element instanceof ExternalToolElement ||
		element instanceof DrawingElement;

	return result;
};
