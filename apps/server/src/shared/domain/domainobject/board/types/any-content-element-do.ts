import { FileElement } from '../file-element.do';
import { RichTextElement } from '../rich-text-element.do';
import type { AnyBoardDo } from './any-board-do';

export type AnyContentElementDo = RichTextElement | FileElement;

export const isAnyContentElement = (element: AnyBoardDo): element is AnyContentElementDo => {
	const result = element instanceof RichTextElement || element instanceof FileElement;

	return result;
};
