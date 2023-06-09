import { FileElement } from '../file-element.do';
import { RichTextElement } from '../rich-text-element.do';
import { TaskElement } from '../task-element.do';
import type { AnyBoardDo } from './any-board-do';

export type AnyContentElementDo = FileElement | RichTextElement | TaskElement;

export const isAnyContentElement = (element: AnyBoardDo): element is AnyContentElementDo => {
	const result = element instanceof FileElement || element instanceof RichTextElement || element instanceof TaskElement;

	return result;
};
