import { MediaExternalToolElement } from '../media-board';
import type { AnyBoardDo } from './any-board-do';

export type AnyMediaContentElementDo = MediaExternalToolElement;

export const isAnyMediaContentElement = (element: AnyBoardDo): element is AnyMediaContentElementDo => {
	const result: boolean = element instanceof MediaExternalToolElement;

	return result;
};
