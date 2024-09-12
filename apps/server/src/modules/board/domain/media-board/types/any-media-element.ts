import { DeletedElement, isDeletedElement } from '../../deleted-element.do';
import { AnyBoardNode } from '../../types';
import { isMediaExternalToolElement, MediaExternalToolElement } from '../media-external-tool-element.do';

export type AnyMediaElement = MediaExternalToolElement | DeletedElement;

export const isAnyMediaElement = (boardNode: AnyBoardNode): boardNode is AnyMediaElement => {
	const result = isMediaExternalToolElement(boardNode) || isDeletedElement(boardNode);

	return result;
};
