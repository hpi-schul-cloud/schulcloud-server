import { DrawingElement } from '../drawing-element.do';
import { FileElement } from '../file-element.do';
import { RichTextElement } from '../rich-text-element.do';
import { SubmissionContainerElement } from '../submission-container-element.do';
import type { AnyBoardDo } from './any-board-do';

export type AnyContentElementDo = FileElement | RichTextElement | DrawingElement | SubmissionContainerElement;

export const isAnyContentElement = (element: AnyBoardDo): element is AnyContentElementDo => {
	const result =
		element instanceof FileElement ||
		element instanceof RichTextElement ||
		element instanceof DrawingElement ||
		element instanceof SubmissionContainerElement;

	return result;
};
