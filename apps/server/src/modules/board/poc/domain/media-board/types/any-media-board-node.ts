import { MediaBoard, MediaExternalToolElement, MediaLine } from '..';

export type AnyMediaBoardNode = MediaBoard | MediaLine | MediaExternalToolElement;

// TODO remove if not needed
export type AnyMediaBoardNode = MediaExternalToolElement;

export const isAnyMediaContentElement = (element: AnyMediaBoardNode): element is AnyMediaBoardNode => {
	const result: boolean = element instanceof MediaExternalToolElement;

	return result;
};
