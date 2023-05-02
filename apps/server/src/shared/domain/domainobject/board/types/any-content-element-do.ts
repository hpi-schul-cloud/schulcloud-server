import { FileElement } from '../file-element.do';
import { TextElement } from '../text-element.do';
import type { AnyBoardDo } from './any-board-do';

export type AnyContentElementDo = TextElement | FileElement;

export const isAnyContentElement = (element: AnyBoardDo): element is AnyContentElementDo => {
	const result = element instanceof TextElement || element instanceof FileElement;

	return result;
};
