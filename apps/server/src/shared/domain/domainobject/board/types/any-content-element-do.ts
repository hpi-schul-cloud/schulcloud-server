import { FileElement } from '../file-element.do';
import { RichTextElement } from '../rich-text-element.do';
import { SubmissionContainerElement } from '../submission-container-element.do';
import type { AnyBoardDo } from './any-board-do';

export type AnyContentElementDo = FileElement | RichTextElement | SubmissionContainerElement;

export const isAnyContentElement = (element: AnyBoardDo): element is AnyContentElementDo => {
	const result =
		element instanceof FileElement ||
		element instanceof RichTextElement ||
		element instanceof SubmissionContainerElement;

	return result;
};

export const isFileElement = (element: AnyBoardDo): element is FileElement => element instanceof FileElement;

export const isRichTextElement = (element: AnyBoardDo): element is RichTextElement =>
	element instanceof RichTextElement;

export const isContent = (element: AnyBoardDo): element is RichTextElement | FileElement =>
	element instanceof RichTextElement || element instanceof FileElement;
