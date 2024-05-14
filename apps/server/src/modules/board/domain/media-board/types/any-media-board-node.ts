import { MediaBoard } from '../media-board.do';
import { MediaExternalToolElement } from '../media-external-tool-element.do';
import { MediaLine } from '../media-line.do';

export type AnyMediaBoardNode = MediaBoard | MediaLine | MediaExternalToolElement;

// TODO remove if not needed
// export type AnyMediaBoardNode = MediaExternalToolElement;

export const isAnyMediaContentElement = (element: AnyMediaBoardNode): element is AnyMediaBoardNode => {
	const result: boolean = element instanceof MediaExternalToolElement;

	return result;
};
